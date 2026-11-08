import { Router, type Response } from "express";
import type { PrismaClient, Profile } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { RegistrationError as HttpError } from "./registration";
import { createListingsRouter } from "./listings";

export interface ApiDependencies {
  db: PrismaClient;
  auth(token?: string): SupabaseClient;
  supabaseUrl: string;
  publicKey: string;
}

export function viewer(res: Response, roles?: Profile["role"][]): Profile {
  const user = res.locals.viewer as Profile | undefined;
  if (!user) throw new HttpError(401, "Za nadaljevanje se prijavite.");
  if (roles && !roles.includes(user.role))
    throw new HttpError(403, "Za to dejanje nimate dovoljenja.");
  return user;
}

const profileInput = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    username: z.string().trim().min(1).max(64),
    phoneNumber: z.string().trim().min(1).max(40),
  })
  .strict();

export function createApiRouter(deps: ApiDependencies) {
  const router = Router();
  router.get("/auth/config", (_req, res) =>
    res.json({ url: deps.supabaseUrl, key: deps.publicKey }),
  );
  router.use(async (req, res, next) => {
    const header = req.get("authorization");
    if (header) {
      const match = /^Bearer (\S+)$/i.exec(header);
      if (!match) throw new HttpError(401, "Neveljavna prijavna seja.");
      const { data, error } = await deps.auth().auth.getUser(match[1]);
      if (error || !data.user)
        throw new HttpError(
          401,
          "Prijavna seja je potekla. Ponovno se prijavite.",
        );
      const profile = await deps.db.profile.findUnique({
        where: { id: data.user.id },
      });
      if (!profile)
        throw new HttpError(
          403,
          "Profil računa ni na voljo. Obrnite se na skrbnika.",
        );
      res.locals.viewer = profile;
      res.locals.token = match[1];
    }
    next();
  });
  router.get("/profile", (_req, res) => res.json(viewer(res)));
  router.patch("/profile", async (req, res) => {
    const user = viewer(res);
    const data = profileInput.parse(req.body);
    res.json(await deps.db.profile.update({ where: { id: user.id }, data }));
  });
  router.use(createListingsRouter(deps));
  return router;
}
