import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app";
import {
  createRegistrationService,
  RegistrationError,
  type RegistrationDependencies,
} from "../src/registration";

const valid = {
  firstName: "Ana",
  lastName: "Novak",
  username: "ana",
  phoneNumber: "040123456",
  email: "ana@example.com",
  password: "LongPassword123!",
  role: "SEEKER",
};
function dependencies(
  overrides: Partial<RegistrationDependencies> = {},
): RegistrationDependencies {
  return {
    findAccount: async () => null,
    usernameExists: async () => false,
    signUp: async () => ({
      userId: "new-user",
      requiresEmailConfirmation: true,
    }),
    profileExists: async () => true,
    ...overrides,
  };
}
async function rejects(status: number, input: unknown, deps = dependencies()) {
  await assert.rejects(
    createRegistrationService(deps)(input),
    (error: unknown) =>
      error instanceof RegistrationError && error.status === status,
  );
}

for (const role of ["SEEKER", "ADVERTISER"]) {
  test(`US-01: creates account and profile for ${role}`, async () => {
    let received: unknown;
    const result = await createRegistrationService(
      dependencies({
        signUp: async (input) => {
          received = input;
          return { userId: "new", requiresEmailConfirmation: true };
        },
      }),
    )({ ...valid, role, email: " ANA@EXAMPLE.COM ", firstName: " Ana " });
    assert.deepEqual(received, { ...valid, role });
    assert.equal(result.requiresEmailConfirmation, true);
    assert.equal("password" in result, false);
    assert.equal("userId" in result, false);
  });
}
test("US-01: blocks ADMIN before contacting Supabase", async () => {
  let called = false;
  await rejects(
    400,
    { ...valid, role: "ADMIN" },
    dependencies({
      signUp: async () => {
        called = true;
        throw Error();
      },
    }),
  );
  assert.equal(called, false);
});
for (const field of ["firstName", "lastName", "username", "phoneNumber"]) {
  test(`US-01: requires ${field}`, async () => {
    await rejects(400, { ...valid, [field]: "   " });
    const missing = { ...valid } as Record<string, unknown>;
    delete missing[field];
    await rejects(400, missing);
  });
}
test("US-01: rejects invalid email and short password", async () => {
  await rejects(400, { ...valid, email: "invalid" });
  await rejects(400, { ...valid, password: "short" });
});
test("US-01: rejects duplicate email without creating an account", async () => {
  let called = false;
  await rejects(
    409,
    valid,
    dependencies({
      findAccount: async () => ({ confirmed: true }),
      signUp: async () => {
        called = true;
        throw Error();
      },
    }),
  );
  assert.equal(called, false);
});
test("US-01: rejects duplicate username", async () => {
  await rejects(409, valid, dependencies({ usernameExists: async () => true }));
});
test("US-01: distinguishes confirmed accounts from pending confirmation", async () => {
  for (const confirmed of [true, false]) {
    let signupCalled = false;
    const service = createRegistrationService(
      dependencies({
        findAccount: async () => ({ confirmed }),
        signUp: async () => {
          signupCalled = true;
          throw new Error("Must not sign up again");
        },
      }),
    );
    await assert.rejects(service(valid), (error: unknown) => {
      assert.ok(error instanceof RegistrationError);
      assert.equal(error.status, 409);
      assert.match(
        error.message,
        confirmed ? /že potrjen/ : /čaka na potrditev/,
      );
      return true;
    });
    assert.equal(signupCalled, false);
  }
});
test("US-01: handles obfuscated duplicate response from Supabase", async () => {
  await rejects(
    409,
    valid,
    dependencies({
      signUp: async () => ({
        userId: "fake",
        duplicate: true,
        requiresEmailConfirmation: true,
      }),
    }),
  );
});
test("US-01: handles a concurrent username conflict", async () => {
  let reads = 0;
  await rejects(
    409,
    valid,
    dependencies({
      usernameExists: async () => ++reads > 1,
      signUp: async () => ({
        userId: null,
        requiresEmailConfirmation: true,
        errorCode: "unexpected_failure",
      }),
    }),
  );
});
test("US-01: reports success only when the profile exists", async () => {
  await rejects(503, valid, dependencies({ profileExists: async () => false }));
});
test("US-01: supports email confirmation being disabled", async () => {
  const result = await createRegistrationService(
    dependencies({
      signUp: async () => ({ userId: "new", requiresEmailConfirmation: false }),
    }),
  )(valid);
  assert.equal(result.requiresEmailConfirmation, false);
});
test("US-01: translates Auth throttling and weak passwords", async () => {
  for (const [errorCode, status] of [
    ["over_email_send_rate_limit", 429],
    ["weak_password", 400],
    ["unexpected_failure", 503],
  ] as const) {
    await rejects(
      status,
      valid,
      dependencies({
        signUp: async () => ({
          userId: null,
          requiresEmailConfirmation: true,
          errorCode,
        }),
      }),
    );
  }
});
test("HTTP: returns validation, duplicate and success responses", async () => {
  const app = createApp(
    dependencies({
      findAccount: async (email) =>
        email === "taken@example.com" ? { confirmed: true } : null,
    }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const redirect = await fetch(`${base}/`, { redirect: "manual" });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get("location"), "http://127.0.0.1:5173/");
    assert.equal((await fetch(`${base}/api/not-found`)).status, 404);
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    for (const [body, status] of [
      [{ ...valid, role: "ADMIN" }, 400],
      [{ ...valid, email: "taken@example.com" }, 409],
      [valid, 201],
    ] as const) {
      const res = await fetch(`${base}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(res.status, status);
      const response = await res.text();
      assert.equal(response.includes(valid.password), false);
    }
    const malformed = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
test("HTTP: local development allows repeated attempts; production still limits them", async () => {
  for (const registrationRateLimit of [false, true]) {
    const server = createApp(dependencies(), { registrationRateLimit }).listen(
      0,
      "127.0.0.1",
    );
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    try {
      for (let attempt = 1; attempt <= 11; attempt++) {
        const response = await fetch(
          `http://127.0.0.1:${address.port}/api/auth/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          },
        );
        assert.equal(
          response.status,
          registrationRateLimit && attempt > 10 ? 429 : 400,
        );
        await response.arrayBuffer();
      }
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }
});
