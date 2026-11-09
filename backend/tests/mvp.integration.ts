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
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGNI6ckjCTGMahjVMHw1AAAIeF4Qd8WWYAAAAABJRU5ErkJggg==",
  "base64",
);

test(
  "MVP: real Auth, profile isolation, listings, private storage, moderation and combined search",
  { timeout: 300000 },
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
      if (process.env.DOMORA_BROWSER_TEST === "1") {
        const { browserFlow } = await import("./browser-flow");
        await browserFlow({
          apiUrl: base.replace(/\/api$/, ""),
          emails,
          password,
          prefix,
          png,
        });
        return;
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
      let photo = (await upload.json()) as any;
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
        (
          await call(
            `/properties/${propertyId}/photos/${photo.id}`,
            0,
            "DELETE",
          )
        ).status,
        200,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/photos/${photo.id}/url`, 0))
          .status,
        404,
      );
      async function uploadPhoto(body: FormData) {
        return fetch(`${base}/properties/${propertyId}/photos`, {
          method: "POST",
          headers: { Authorization: `Bearer ${tokens[0]}` },
          body,
        });
      }
      const invalidImage = new FormData();
      invalidImage.set(
        "photo",
        new Blob(["not an image"], { type: "image/png" }),
        "invalid.png",
      );
      assert.equal((await uploadPhoto(invalidImage)).status, 415);
      const oversized = new FormData();
      oversized.set(
        "photo",
        new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: "image/png" }),
        "large.png",
      );
      assert.equal((await uploadPhoto(oversized)).status, 400);
      const replacement = await uploadPhoto(form);
      assert.equal(replacement.status, 201);
      photo = await replacement.json();
      for (let i = 0; i < 8; i++)
        assert.equal((await uploadPhoto(form)).status, 201);
      const limitRace = await Promise.all([
        uploadPhoto(form),
        uploadPhoto(form),
      ]);
      assert.deepEqual(limitRace.map((r) => r.status).sort(), [201, 409]);
      assert.equal(await db.propertyPhoto.count({ where: { propertyId } }), 10);
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
      const future = Date.now() + 2 * 86400000;
      const at = (hours: number) =>
        new Date(future + hours * 3600000).toISOString();
      assert.equal(
        (
          await call(`/properties/${propertyId}/slots`, 1, "POST", {
            startsAt: at(0),
            endsAt: at(1),
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/slots`, 0, "POST", {
            startsAt: at(1),
            endsAt: at(0),
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/slots`, 0, "POST", {
            startsAt: new Date(Date.now() - 3600000).toISOString(),
            endsAt: at(0),
          })
        ).status,
        400,
      );
      const slot = (
        await call(`/properties/${propertyId}/slots`, 0, "POST", {
          startsAt: at(0),
          endsAt: at(1),
        })
      ).body;
      assert.ok(slot.id);
      assert.equal(
        (
          await call(`/properties/${propertyId}/slots`, 0, "POST", {
            startsAt: at(0.5),
            endsAt: at(1.5),
          })
        ).status,
        409,
      );
      const adjacent = (
        await call(`/properties/${propertyId}/slots`, 0, "POST", {
          startsAt: at(1),
          endsAt: at(2),
        })
      ).body;
      assert.ok(adjacent.id);
      assert.equal(
        (
          await call(`/properties/${propertyId}/requests`, null, "POST", {
            slotId: slot.id,
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/requests`, 0, "POST", {
            slotId: slot.id,
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/requests`, 4, "POST", {
            slotId: slot.id,
          })
        ).status,
        403,
      );
      const requestA = (
        await call(`/properties/${propertyId}/requests`, 2, "POST", {
          slotId: slot.id,
          message: "First request",
        })
      ).body;
      const requestB = (
        await call(`/properties/${propertyId}/requests`, 3, "POST", {
          slotId: slot.id,
        })
      ).body;
      const advertiserRequest = (
        await call(`/properties/${propertyId}/requests`, 1, "POST", {
          slotId: slot.id,
        })
      ).body;
      assert.equal(requestA.status, "PENDING");
      assert.equal(advertiserRequest.status, "PENDING");
      assert.equal(
        (
          await call(`/properties/${propertyId}/requests`, 2, "POST", {
            slotId: slot.id,
          })
        ).status,
        409,
      );
      assert.equal(
        "exactAddress" in
          (await call(`/my/requests/${requestA.id}`, 2)).body.property,
        false,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/requests`, 1)).status,
        403,
      );
      assert.equal(
        (
          await call(
            `/properties/${propertyId}/requests/${requestA.id}/decision`,
            1,
            "POST",
            { decision: "confirm" },
          )
        ).status,
        403,
      );
      const competing = await Promise.all(
        [requestA, requestB].map((r) =>
          call(
            `/properties/${propertyId}/requests/${r.id}/decision`,
            0,
            "POST",
            { decision: "confirm" },
          ),
        ),
      );
      assert.deepEqual(competing.map((r) => r.status).sort(), [200, 409]);
      const confirmed = await db.viewingRequest.findMany({
        where: { slotId: slot.id, status: "CONFIRMED" },
      });
      assert.equal(confirmed.length, 1);
      const winner = confirmed[0].seekerId === ids[2] ? 2 : 3;
      assert.equal(
        (await call(`/my/requests/${confirmed[0].id}`, winner)).body.property
          .exactAddress,
        listing.exactAddress,
      );
      assert.equal(
        (await call(`/my/requests/${confirmed[0].id}`, winner === 2 ? 3 : 2))
          .status,
        404,
      );
      assert.equal(
        await db.viewingRequest.count({
          where: { slotId: slot.id, status: "REJECTED" },
        }),
        2,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/requests`, 2, "POST", {
            slotId: slot.id,
          })
        ).status,
        409,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/slots`)).body.find(
          (s: any) => s.id === slot.id,
        ).available,
        false,
      );
      const rejected = (
        await call(`/properties/${propertyId}/requests`, 2, "POST", {
          slotId: adjacent.id,
        })
      ).body;
      assert.equal(
        (
          await call(
            `/properties/${propertyId}/requests/${rejected.id}/decision`,
            0,
            "POST",
            { decision: "reject" },
          )
        ).body.status,
        "REJECTED",
      );
      assert.equal(
        (await call(`/properties/${propertyId}/slots`)).body.find(
          (s: any) => s.id === adjacent.id,
        ).available,
        true,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/requests`, 2, "POST", {
            slotId: adjacent.id,
          })
        ).status,
        409,
      );
      const pending = (
        await call(`/properties/${propertyId}/requests`, 3, "POST", {
          slotId: adjacent.id,
        })
      ).body;
      // Published edits must pass through a private draft and a fresh review.
      for (const [actor, status] of [
        [null, 401],
        [1, 403],
        [2, 403],
        [4, 403],
      ] as const)
        assert.equal(
          (await call(`/properties/${propertyId}/edit`, actor, "POST")).status,
          status,
        );
      const editingRace = await Promise.all([
        call(`/properties/${propertyId}/edit`, 0, "POST"),
        call(`/properties/${propertyId}/edit`, 0, "POST"),
      ]);
      assert.deepEqual(editingRace.map((r) => r.status).sort(), [200, 409]);
      const editing = (await call(`/properties/${propertyId}`, 0)).body;
      assert.equal(editing.status, "DRAFT");
      assert.equal(editing.reviewedBy, null);
      assert.equal(editing.reviewReason, null);
      assert.equal(editing.title, listing.title);
      assert.equal((await call(`/properties/${propertyId}`)).status, 404);
      assert.equal((await call(`/properties?city=${prefix}`)).body.length, 0);
      assert.equal((await call(`/properties/${propertyId}/slots`)).status, 404);
      assert.equal(
        (await call(`/properties/${propertyId}/photos/${photo.id}/url`)).status,
        404,
      );
      const duringEdit = (await call(`/my/requests/${confirmed[0].id}`, winner))
        .body;
      assert.equal(duringEdit.status, "CONFIRMED");
      assert.equal("exactAddress" in duringEdit.property, false);
      assert.equal(duringEdit.property.title, "Oglas je začasno v urejanju");
      assert.deepEqual(duringEdit.property.photos, []);
      assert.equal(
        (
          await db.viewingRequest.findUniqueOrThrow({
            where: { id: pending.id },
          })
        ).status,
        "PENDING",
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/requests`, 1, "POST", {
            slotId: adjacent.id,
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/review`, 4, "POST", {
            decision: "approve",
          })
        ).status,
        409,
      );
      const revisedAddress = "REVISED-PRIVATE-" + prefix;
      assert.equal(
        (
          await call(`/properties/${propertyId}`, 0, "PATCH", {
            title: "",
            price: 125000,
            exactAddress: revisedAddress,
          })
        ).status,
        200,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/submit`, 0, "POST")).status,
        400,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}`, 0, "PATCH", {
            title: "Updated " + prefix,
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call(
            `/properties/${propertyId}/photos/${photo.id}`,
            0,
            "DELETE",
          )
        ).status,
        200,
      );
      const revisedPhoto = await uploadPhoto(form);
      assert.equal(revisedPhoto.status, 201);
      photo = await revisedPhoto.json();
      assert.equal(
        (await call(`/properties/${propertyId}/photos/${photo.id}/url`)).status,
        404,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/submit`, 0, "POST")).body.status,
        "PENDING_REVIEW",
      );
      assert.equal((await call(`/properties/${propertyId}`)).status, 404);
      for (const path of [`/my/requests/${confirmed[0].id}`, "/my/requests"]) {
        const privateHistory = JSON.stringify((await call(path, winner)).body);
        assert.equal(privateHistory.includes("Updated " + prefix), false);
        assert.equal(privateHistory.includes(revisedAddress), false);
        assert.equal(privateHistory.includes('"price":"125000"'), false);
      }
      assert.ok(
        (await call("/admin/properties", 4)).body.some(
          (p: any) => p.id === propertyId,
        ),
      );
      assert.equal(
        (await call(`/properties/${propertyId}/edit`, 0, "POST")).status,
        409,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}`, 0, "PATCH", {
            title: "Bypass review",
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/review`, 4, "POST", {
            decision: "reject",
            reason: "Dopolnite opis.",
          })
        ).body.status,
        "REJECTED",
      );
      assert.equal((await call(`/properties/${propertyId}`)).status, 404);
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
      const revisedPublic = (await call(`/properties/${propertyId}`)).body;
      assert.equal(revisedPublic.title, "Updated " + prefix);
      assert.equal(Number(revisedPublic.price), 125000);
      assert.equal("exactAddress" in revisedPublic, false);
      assert.equal(
        (await call(`/properties/${propertyId}/photos/${photo.id}/url`)).status,
        200,
      );
      assert.equal(
        (await call(`/my/requests/${confirmed[0].id}`, winner)).body.property
          .exactAddress,
        revisedAddress,
      );
      assert.equal(
        (await call(`/properties/${propertyId}/slots`)).body.find(
          (s: any) => s.id === slot.id,
        ).available,
        false,
      );
      assert.equal(
        (
          await db.viewingRequest.findUniqueOrThrow({
            where: { id: pending.id },
          })
        ).status,
        "PENDING",
      );
      const past = await db.viewingSlot.create({
        data: {
          propertyId,
          startsAt: new Date(Date.now() - 7200000),
          endsAt: new Date(Date.now() - 3600000),
        },
      });
      const pastRequest = await db.viewingRequest.create({
        data: { slotId: past.id, seekerId: ids[2], status: "CONFIRMED" },
      });
      assert.equal(
        (
          await call(`/properties/${propertyId}/close`, 1, "POST", {
            status: "INACTIVE",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/close`, 0, "POST", {
            status: "RENTED",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/close`, 0, "POST", {
            status: "INACTIVE",
          })
        ).body.status,
        "INACTIVE",
      );
      assert.equal(
        (
          await db.viewingRequest.findUniqueOrThrow({
            where: { id: confirmed[0].id },
          })
        ).status,
        "CANCELLED",
      );
      assert.equal(
        (
          await db.viewingRequest.findUniqueOrThrow({
            where: { id: pending.id },
          })
        ).status,
        "CANCELLED",
      );
      assert.equal(
        (
          await db.viewingRequest.findUniqueOrThrow({
            where: { id: rejected.id },
          })
        ).status,
        "REJECTED",
      );
      assert.equal(
        (
          await db.viewingRequest.findUniqueOrThrow({
            where: { id: pastRequest.id },
          })
        ).status,
        "CONFIRMED",
      );
      assert.equal(
        "exactAddress" in
          (await call(`/my/requests/${confirmed[0].id}`, winner)).body.property,
        false,
      );
      assert.equal(
        "exactAddress" in
          (await call(`/my/requests/${pastRequest.id}`, 2)).body.property,
        false,
      );
      assert.equal((await call(`/properties/${propertyId}`)).status, 404);
      assert.equal((await call(`/properties/${propertyId}/slots`)).status, 404);
      assert.equal(
        (await call(`/properties/${propertyId}/edit`, 0, "POST")).status,
        409,
      );
      assert.equal(
        (
          await call(`/properties/${propertyId}/requests`, 2, "POST", {
            slotId: adjacent.id,
          })
        ).status,
        409,
      );
      for (const [listingType, status] of [
        ["SALE", "SOLD"],
        ["RENT", "RENTED"],
      ]) {
        const next = (
          await call("/properties", 0, "POST", { ...listing, listingType })
        ).body;
        assert.equal(
          (
            await call(`/properties/${next.id}/slots`, 0, "POST", {
              startsAt: at(0),
              endsAt: at(1),
            })
          ).status,
          409,
        );
        await call(`/properties/${next.id}/submit`, 0, "POST");
        await call(`/properties/${next.id}/review`, 4, "POST", {
          decision: "approve",
        });
        const nextSlot = (
          await call(`/properties/${next.id}/slots`, 0, "POST", {
            startsAt: at(0),
            endsAt: at(1),
          })
        ).body;
        const nextRequest = (
          await call(`/properties/${next.id}/requests`, 2, "POST", {
            slotId: nextSlot.id,
          })
        ).body;
        const race = await Promise.all([
          call(
            `/properties/${next.id}/requests/${nextRequest.id}/decision`,
            0,
            "POST",
            { decision: "confirm" },
          ),
          call(`/properties/${next.id}/close`, 0, "POST", { status }),
        ]);
        assert.equal(race[1].status, 200);
        assert.ok([200, 409].includes(race[0].status));
        assert.equal(
          (
            await db.viewingRequest.findUniqueOrThrow({
              where: { id: nextRequest.id },
            })
          ).status,
          "CANCELLED",
        );
        assert.equal((await call(`/properties/${next.id}`)).status, 404);
      }
      console.log(
        "Real Auth and Storage, full listing lifecycle, concurrent bookings, request privacy, and atomic closure checks passed.",
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
