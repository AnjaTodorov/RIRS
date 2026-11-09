import { Router, type Response } from "express";
import { Prisma, type Property } from "@prisma/client";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { z } from "zod";
import { viewer, type ApiDependencies } from "./accounts";
import { RegistrationError as HttpError } from "./registration";

export const bucket = "domora-properties";
export const id = (value: unknown) => z.uuid().parse(value);
const text = z.string().trim().max(10000);
const amount = (max: number) =>
  z
    .number()
    .finite()
    .min(0.01)
    .max(max)
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
      "Največ dve decimalni mesti.",
    );
export const draftInput = z
  .object({
    title: text.max(200),
    description: text,
    city: text.max(100),
    publicLocation: text.max(300),
    exactAddress: text.max(300),
    propertyType: text.max(80),
    listingType: z.enum(["SALE", "RENT"]).nullable(),
    price: amount(999999999999).nullable(),
    areaM2: amount(9999999999).nullable(),
  })
  .strict()
  .partial();
const completeInput = draftInput.required().extend({
  title: text.min(1),
  description: text.min(1),
  city: text.min(1),
  publicLocation: text.min(1),
  exactAddress: text.min(1),
  propertyType: text.min(1),
  listingType: z.enum(["SALE", "RENT"]),
  price: amount(999999999999),
  areaM2: amount(9999999999),
});
export const publicSelect = {
  id: true,
  title: true,
  description: true,
  city: true,
  publicLocation: true,
  propertyType: true,
  listingType: true,
  price: true,
  areaM2: true,
  status: true,
  photos: {
    select: { id: true, position: true },
    orderBy: { position: "asc" as const },
  },
} satisfies Prisma.PropertySelect;
export async function lockedProperty<T>(
  deps: ApiDependencies,
  propertyId: string,
  action: (tx: Prisma.TransactionClient, property: Property) => Promise<T>,
) {
  return deps.db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM public.properties WHERE id = ${propertyId}::uuid FOR UPDATE`;
      const property = await tx.property.findUnique({
        where: { id: propertyId },
      });
      if (!property) throw new HttpError(404, "Oglas ne obstaja.");
      return action(tx, property);
    },
    { timeout: 20000 },
  );
}
export function owner(res: Response, property: Property) {
  const user = viewer(res, ["ADVERTISER"]);
  if (property.advertiserId !== user.id)
    throw new HttpError(403, "Ta oglas ni vaš.");
  return user;
}
export function editable(res: Response, property: Property) {
  owner(res, property);
  if (!["DRAFT", "REJECTED"].includes(property.status))
    throw new HttpError(409, "Urejate lahko osnutek ali zavrnjen oglas.");
}
async function visibleProperty(
  deps: ApiDependencies,
  res: Response,
  propertyId: string,
) {
  const property = await deps.db.property.findUnique({
    where: { id: propertyId },
    include: {
      photos: {
        select: { id: true, position: true },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!property) throw new HttpError(404, "Oglas ne obstaja.");
  const user = res.locals.viewer;
  if (user && (user.id === property.advertiserId || user.role === "ADMIN"))
    return property;
  if (property.status !== "PUBLISHED")
    throw new HttpError(404, "Oglas ni objavljen.");
  const published = await deps.db.property.findFirst({
    // Recheck visibility in the same query that reads the public fields: the
    // owner may have started editing since the initial authorization read.
    where: { id: propertyId, status: "PUBLISHED" },
    select: publicSelect,
  });
  if (!published) throw new HttpError(404, "Oglas ni objavljen.");
  return published;
}
const numericFilter = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.coerce.number().finite().nonnegative().optional(),
);
const filters = z
  .object({
    city: z.string().max(100).optional(),
    minPrice: numericFilter,
    maxPrice: numericFilter,
    minArea: numericFilter,
    maxArea: numericFilter,
    propertyType: z.string().max(80).optional(),
    listingType: z.enum(["SALE", "RENT"]).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.minPrice !== undefined &&
      v.maxPrice !== undefined &&
      v.minPrice > v.maxPrice
    )
      ctx.addIssue({
        code: "custom",
        path: ["minPrice"],
        message: "Neveljaven cenovni razpon.",
      });
    if (
      v.minArea !== undefined &&
      v.maxArea !== undefined &&
      v.minArea > v.maxArea
    )
      ctx.addIssue({
        code: "custom",
        path: ["minArea"],
        message: "Neveljaven razpon površine.",
      });
  });
export function createListingsRouter(deps: ApiDependencies) {
  const router = Router();
  router.get("/properties", async (req, res) => {
    const f = filters.parse(req.query);
    res.json(
      await deps.db.property.findMany({
        where: {
          status: "PUBLISHED",
          ...(f.city
            ? { city: { contains: f.city, mode: "insensitive" } }
            : {}),
          ...(f.propertyType ? { propertyType: f.propertyType } : {}),
          ...(f.listingType ? { listingType: f.listingType } : {}),
          price: { gte: f.minPrice, lte: f.maxPrice },
          areaM2: { gte: f.minArea, lte: f.maxArea },
        },
        select: publicSelect,
        orderBy: { id: "asc" },
      }),
    );
  });
  router.get("/my/properties", async (_req, res) => {
    const user = viewer(res, ["ADVERTISER"]);
    res.json(
      await deps.db.property.findMany({
        where: { advertiserId: user.id },
        include: { photos: { select: { id: true, position: true } } },
        orderBy: { id: "desc" },
      }),
    );
  });
  router.get("/admin/properties", async (_req, res) => {
    viewer(res, ["ADMIN"]);
    res.json(
      await deps.db.property.findMany({
        where: { status: "PENDING_REVIEW" },
        include: { photos: { select: { id: true, position: true } } },
      }),
    );
  });
  router.post("/properties", async (req, res) => {
    const user = viewer(res, ["ADVERTISER"]);
    const data = draftInput.parse(req.body);
    res.status(201).json(
      await deps.db.property.create({
        data: { ...data, advertiserId: user.id, status: "DRAFT" },
      }),
    );
  });
  router.get("/properties/:id", async (req, res) =>
    res.json(await visibleProperty(deps, res, id(req.params.id))),
  );
  router.post("/properties/:id/edit", async (req, res) => {
    viewer(res, ["ADVERTISER"]);
    res.json(
      await lockedProperty(deps, id(req.params.id), async (tx, p) => {
        owner(res, p);
        if (p.status !== "PUBLISHED")
          throw new HttpError(
            409,
            "V osnutek lahko vrnete samo objavljen oglas.",
          );
        // Hide the listing before any field or photo can change. Reuse the
        // normal submission/review flow; viewing slots and requests are retained.
        return tx.property.update({
          where: { id: p.id },
          data: { status: "DRAFT", reviewedBy: null, reviewReason: null },
        });
      }),
    );
  });
  router.patch("/properties/:id", async (req, res) => {
    viewer(res, ["ADVERTISER"]);
    const data = draftInput.parse(req.body);
    res.json(
      await lockedProperty(deps, id(req.params.id), async (tx, p) => {
        editable(res, p);
        return tx.property.update({ where: { id: p.id }, data });
      }),
    );
  });
  router.post("/properties/:id/submit", async (req, res) => {
    viewer(res, ["ADVERTISER"]);
    res.json(
      await lockedProperty(deps, id(req.params.id), async (tx, p) => {
        editable(res, p);
        const data = Object.fromEntries(
          Object.keys(draftInput.shape).map((key) => [key, (p as any)[key]]),
        );
        completeInput.parse({
          ...data,
          price: p.price === null ? null : Number(p.price),
          areaM2: p.areaM2 === null ? null : Number(p.areaM2),
        });
        return tx.property.update({
          where: { id: p.id },
          data: {
            status: "PENDING_REVIEW",
            reviewReason: null,
            reviewedBy: null,
          },
        });
      }),
    );
  });
  router.post("/properties/:id/review", async (req, res) => {
    const admin = viewer(res, ["ADMIN"]);
    const data = z
      .discriminatedUnion("decision", [
        z.object({ decision: z.literal("approve") }).strict(),
        z
          .object({
            decision: z.literal("reject"),
            reason: z.string().trim().min(1).max(2000),
          })
          .strict(),
      ])
      .parse(req.body);
    res.json(
      await lockedProperty(deps, id(req.params.id), async (tx, p) => {
        if (p.status !== "PENDING_REVIEW")
          throw new HttpError(409, "Oglas ne čaka na pregled.");
        return tx.property.update({
          where: { id: p.id },
          data: {
            status: data.decision === "approve" ? "PUBLISHED" : "REJECTED",
            reviewedBy: admin.id,
            reviewReason: data.decision === "reject" ? data.reason : null,
          },
        });
      }),
    );
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  });
  router.post(
    "/properties/:id/photos",
    (req, res, next) => {
      viewer(res, ["ADVERTISER"]);
      next();
    },
    upload.single("photo"),
    async (req, res) => {
      const file = req.file;
      if (!file) throw new HttpError(400, "Izberite fotografijo.");
      const b = file.buffer;
      const jpeg = b[0] === 255 && b[1] === 216 && b[2] === 255;
      const png = b
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const webp =
        b.toString("ascii", 0, 4) === "RIFF" &&
        b.toString("ascii", 8, 12) === "WEBP";
      if (!(
        (jpeg && file.mimetype === "image/jpeg") ||
        (png && file.mimetype === "image/png") ||
        (webp && file.mimetype === "image/webp")
      ))
        throw new HttpError(415, "Dovoljene so fotografije JPG, PNG in WebP.");
      const user = viewer(res, ["ADVERTISER"]);
      const propertyId = id(req.params.id);
      const path = `${user.id}/${propertyId}/${randomUUID()}.${jpeg ? "jpg" : png ? "png" : "webp"}`;
      const storage = deps.auth(res.locals.token).storage.from(bucket);
      let stored = false;
      try {
        const photo = await lockedProperty(deps, propertyId, async (tx, p) => {
          editable(res, p);
          const count = await tx.propertyPhoto.count({ where: { propertyId } });
          if (count >= 10)
            throw new HttpError(409, "Oglas ima lahko največ 10 fotografij.");
          const { error } = await storage.upload(path, b, {
            contentType: file.mimetype,
            upsert: false,
          });
          if (error)
            throw new HttpError(503, "Fotografije ni bilo mogoče naložiti.");
          stored = true;
          return tx.propertyPhoto.create({
            data: { propertyId, storagePath: path, position: count },
            select: { id: true, position: true },
          });
        });
        res.status(201).json(photo);
      } catch (e) {
        if (stored) await storage.remove([path]);
        throw e;
      }
    },
  );
  router.delete("/properties/:id/photos/:photoId", async (req, res) => {
    viewer(res, ["ADVERTISER"]);
    await lockedProperty(deps, id(req.params.id), async (tx, p) => {
      editable(res, p);
      const photo = await tx.propertyPhoto.findFirst({
        where: { id: id(req.params.photoId), propertyId: p.id },
      });
      if (!photo) throw new HttpError(404, "Fotografija ne obstaja.");
      // Remove the relation first: a storage cleanup failure must not show a removed photo.
      await tx.propertyPhoto.delete({ where: { id: photo.id } });
      await deps
        .auth(res.locals.token)
        .storage.from(bucket)
        .remove([photo.storagePath]);
    });
    res.json({ message: "Fotografija je odstranjena." });
  });
  router.get(
    [
      "/properties/:id/photos/:photoId/content",
      "/properties/:id/photos/:photoId/url",
    ],
    async (req, res) => {
      const p = await visibleProperty(deps, res, id(req.params.id));
      const photo = await deps.db.propertyPhoto.findFirst({
        where: { id: id(req.params.photoId), propertyId: p.id },
      });
      if (!photo) throw new HttpError(404, "Fotografija ne obstaja.");
      const { data, error } = await deps
        .auth(res.locals.token)
        .storage.from(bucket)
        .createSignedUrl(photo.storagePath, 60);
      if (error || !data)
        throw new HttpError(503, "Fotografija trenutno ni na voljo.");
      res.set("Cache-Control", "no-store");
      if (req.path.endsWith("/url")) res.json({ url: data.signedUrl });
      else res.redirect(302, data.signedUrl);
    },
  );
  return router;
}
