import { test } from "node:test";
import assert from "node:assert/strict";
import { createApiRouter, type ApiDependencies } from "../src/accounts";
import { createApp } from "../src/app";
import type { RegistrationDependencies } from "../src/registration";

test("US-02/03: verifies tokens, reads database role and restricts profile edits", async () => {
  const profile = {
    id: "user-a",
    firstName: "Ana",
    lastName: "Novak",
    username: "ana",
    phoneNumber: "000",
    role: "SEEKER",
  };
  let updated: any;
  const deps = {
    supabaseUrl: "https://example.supabase.co",
    publicKey: "public-test-key",
    auth: () => ({
      auth: {
        getUser: async (token: string) =>
          token === "valid"
            ? {
                data: {
                  user: { id: "user-a", user_metadata: { role: "ADMIN" } },
                },
                error: null,
              }
            : { data: { user: null }, error: {} },
      },
    }),
    db: {
      profile: {
        findUnique: async () => profile,
        update: async (args: any) => {
          updated = args;
          return { ...profile, ...args.data };
        },
      },
    },
  } as unknown as ApiDependencies;
  const app = createApp({} as RegistrationDependencies, {
    apiRouter: createApiRouter(deps),
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/api/profile`;
  try {
    assert.equal((await fetch(url)).status, 401);
    assert.equal(
      (await fetch(url, { headers: { Authorization: "Bearer invalid" } }))
        .status,
      401,
    );
    const me = await fetch(url, { headers: { Authorization: "Bearer valid" } });
    assert.equal(((await me.json()) as any).role, "SEEKER");
    const change = async (body: any) =>
      fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    assert.equal((await change({ ...profile, role: "ADMIN" })).status, 400);
    assert.equal(
      (
        await change({
          firstName: " ",
          lastName: "Novak",
          username: "ana",
          phoneNumber: "000",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await change({
          firstName: "Ana",
          lastName: "Novak",
          username: "new",
          phoneNumber: "123",
        })
      ).status,
      200,
    );
    assert.deepEqual(updated.where, { id: "user-a" });
    assert.equal(updated.data.role, undefined);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});
