import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { createApiRouter } from "../src/accounts";
import { createApp } from "../src/app";
import type { RegistrationDependencies } from "../src/registration";
config({ path: resolve(__dirname, "../../.env"), quiet: true });
const db = new PrismaClient();
const url = process.env.SUPABASE_URL!;
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
const auth = (token?: string) =>
  createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : {}),
  });
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6d1sAAAAASUVORK5CYII=",
  "base64",
);

test(
  "MVP: real Auth, profile isolation, listings, private storage, moderation and combined search",
  { timeout: 180000 },
  async () => {
    const ids = Array.from({ length: 5 }, () => randomUUID());
    const tokens: string[] = [];
    const emails: string[] = [];
    const prefix = "mvp-" + randomUUID();
    const password = randomBytes(24).toString("hex");
    const app = createApp({} as RegistrationDependencies, {
      apiRouter: createApiRouter({
        db,
        auth,
        supabaseUrl: url,
        publicKey: key,
      }),
    });
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((r) => server.once("listening", r));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api`;
    async function call(
      path: string,
      actor: number | null = null,
      method = "GET",
      body?: unknown,
    ) {
      const headers: Record<string, string> = {};
      if (actor !== null) headers.Authorization = `Bearer ${tokens[actor]}`;
      if (body !== undefined) headers["Content-Type"] = "application/json";
      const res = await fetch(base + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: res.status, body: (await res.json()) as any };
    }
    try {
      for (let i = 0; i < ids.length; i++) {
        const email = `${prefix}-${i}@example.com`;
        emails.push(email);
        const metadata = JSON.stringify({
          first_name: "Integration",
          last_name: "Test",
          username: `${prefix}-${i}`,
          phone_number: "000000",
          role: i < 2 ? "ADVERTISER" : "SEEKER",
        });
        await db.$executeRaw`INSERT INTO auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,reauthentication_token,created_at,updated_at)
     VALUES(${ids[i]}::uuid,'00000000-0000-0000-0000-000000000000'::uuid,'authenticated','authenticated',${email},extensions.crypt(${password},extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,${metadata}::jsonb,'','','','','','',now(),now())`;
        await db.$executeRaw`INSERT INTO auth.identities(id,provider_id,user_id,identity_data,provider,created_at,updated_at)
     VALUES(${randomUUID()}::uuid,${ids[i]},${ids[i]}::uuid,${JSON.stringify({ sub: ids[i], email, email_verified: true })}::jsonb,'email',now(),now())`;
        if (i === 4)
          await db.profile.update({
            where: { id: ids[i] },
            data: { role: "ADMIN" },
          });
        const login = await auth().auth.signInWithPassword({ email, password });
        assert.equal(
          login.error,
          null,
          "Fixture login must succeed; tokens and credentials are not logged",
        );
        assert.ok(login.data.session);
        tokens.push(login.data.session.access_token);
      }
      assert.equal((await call("/profile")).status, 401);
      assert.equal((await call("/profile", 0)).body.role, "ADVERTISER");
      assert.equal(
        (
          await call("/profile", 0, "PATCH", {
            firstName: "Test",
            lastName: "Test",
            username: prefix + "-0",
            phoneNumber: "000",
            role: "ADMIN",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call("/profile", 0, "PATCH", {
            firstName: "Test",
            lastName: "Test",
            username: prefix + "-1",
            phoneNumber: "000",
          })
        ).status,
        409,
      );
      assert.equal((await call("/properties", 2, "POST", {})).status, 403);
      const created = await call("/properties", 0, "POST", {});
      assert.equal(created.status, 201);
      const propertyId = created.body.id;
      assert.equal(created.body.status, "DRAFT");
      assert.equal((await call(`/properties/${propertyId}`)).status, 404);
      assert.equal(
        (
          await call(`/properties/${propertyId}`, 1, "PATCH", {
            title: "Hacked",
          })
        ).status,
        403,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/submit`, 0, "POST")).status,
        400,
      );
      const listing = {
        title: prefix,
        description: "Integration test",
        city: prefix,
        publicLocation: "Public area",
        exactAddress: "PRIVATE-ADDRESS-" + prefix,
        propertyType: "Stanovanje",
        listingType: "SALE",
        price: 120000,
        areaM2: 60,
      };
      assert.equal(
        (await call(`/properties/${propertyId}`, 0, "PATCH", listing)).status,
        200,
      );
      const form = new FormData();
      form.set("photo", new Blob([png], { type: "image/png" }), "test.png");
      const upload = await fetch(`${base}/properties/${propertyId}/photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokens[0]}` },
        body: form,
      });
      assert.equal(
        upload.status,
        201,
        "Real private Storage upload must succeed",
      );
      const photo = (await upload.json()) as any;
      assert.equal(
        (await call(`/properties/${propertyId}/photos/${photo.id}/url`)).status,
        404,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/photos/${photo.id}/url`, 0))
          .status,
        200,
      );
      assert.equal(
        (
          await call(
            `/properties/${propertyId}/photos/${photo.id}`,
            1,
            "DELETE",
          )
        ).status,
        403,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/submit`, 0, "POST")).status,
        200,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/review`, 0, "POST", {
            decision: "approve",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/review`, 4, "POST", {
            decision: "reject",
            reason: "   ",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/review`, 4, "POST", {
            decision: "reject",
            reason: "Improve description",
          })
        ).body.status,
        "REJECTED",
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}`, 0, "PATCH", {
            description: "Improved",
          })
        ).body.status,
        "REJECTED",
      );
      assert.equal(
        (await call(`/properties/${propertyId}/submit`, 0, "POST")).body.status,
        "PENDING_REVIEW",
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/review`, 4, "POST", {
            decision: "approve",
          })
        ).body.status,
        "PUBLISHED",
      );
      const published = await call(`/properties/${propertyId}`);
      assert.equal(published.status, 200);
      assert.equal("exactAddress" in published.body, false);
      assert.equal("advertiserId" in published.body, false);
      const publicPhoto = await call(
        `/properties/${propertyId}/photos/${photo.id}/url`,
      );
      assert.equal(publicPhoto.status, 200);
      assert.equal((await fetch(publicPhoto.body.url)).status, 200);
      const results = await call(
        `/properties?city=${prefix}&minPrice=100000&maxPrice=130000&minArea=50&maxArea=70&listingType=SALE&propertyType=Stanovanje`,
      );
      assert.equal(results.body.length, 1);
      assert.equal(
        JSON.stringify(results.body).includes(listing.exactAddress),
        false,
      );
      assert.equal(
        (await call(`/properties?city=${prefix}&maxPrice=1`)).body.length,
        0,
      );
      assert.equal(
        (await call("/properties?minPrice=10&maxPrice=1")).status,
        400,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}`, 0, "PATCH", {
            title: "Cannot edit published",
          })
        ).status,
        409,
      );
      console.log(
        "Real Auth login, database ownership, Storage upload/read, moderation, private-address exclusion and filters passed.",
      );
    } finally {
      const properties = await db.property.findMany({
        where: { advertiserId: { in: ids } },
        select: { id: true },
      });
      const photos = await db.propertyPhoto.findMany({
        where: { propertyId: { in: properties.map((p) => p.id) } },
      });
      await db.property.updateMany({
        where: { advertiserId: { in: ids } },
        data: { status: "DRAFT" },
      });
      for (let i = 0; i < tokens.length; i++) {
        const paths = photos
          .filter((p) => p.storagePath.startsWith(ids[i] + "/"))
          .map((p) => p.storagePath);
        if (paths.length)
          await auth(tokens[i]).storage.from("domora-properties").remove(paths);
      }
      await db.property.deleteMany({ where: { advertiserId: { in: ids } } });
      await db.profile.deleteMany({ where: { id: { in: ids } } });
      for (const userId of ids)
        await db.$executeRaw`DELETE FROM auth.users WHERE id=${userId}::uuid`;
      await new Promise<void>((r) => server.close(() => r()));
      await db.$disconnect();
    }
  },
);
