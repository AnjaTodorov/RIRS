import { Router } from "express";
import { z } from "zod";
import { viewer, type ApiDependencies } from "./accounts";
import { id, lockedProperty, owner, publicSelect } from "./listings";
import { RegistrationError as HttpError } from "./registration";

const slotInput = z
  .object({
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
  })
  .strict();
const requestInclude = {
  slot: {
    include: { property: { select: { ...publicSelect, exactAddress: true } } },
  },
} as const;
function requestView(value: any) {
  const { exactAddress, ...property } = value.slot.property;
  const underReview = ["DRAFT", "PENDING_REVIEW", "REJECTED"].includes(
    property.status,
  );
  return {
    id: value.id,
    status: value.status,
    message: value.message,
    createdAt: value.createdAt,
    decidedAt: value.decidedAt,
    slot: {
      id: value.slot.id,
      startsAt: value.slot.startsAt,
      endsAt: value.slot.endsAt,
    },
    // Existing applicants retain their appointment history, but may not read
    // unapproved edits through the personal-requests endpoint.
    property: underReview
      ? {
          id: property.id,
          status: property.status,
          title: "Oglas je začasno v urejanju",
          description: "",
          city: "",
          publicLocation: "",
          propertyType: "",
          listingType: null,
          price: null,
          areaM2: null,
          photos: [],
        }
      : {
          ...property,
          ...(value.status === "CONFIRMED" && property.status === "PUBLISHED"
            ? { exactAddress }
            : {}),
        },
  };
}
export function createViewingsRouter(deps: ApiDependencies) {
  const router = Router();
  router.get("/properties/:id/slots", async (req, res) => {
    const p = await deps.db.property.findUnique({
      where: { id: id(req.params.id) },
      select: { status: true },
    });
    if (!p || p.status !== "PUBLISHED")
      throw new HttpError(404, "Oglas ni objavljen.");
    const slots = await deps.db.viewingSlot.findMany({
      where: { propertyId: id(req.params.id), startsAt: { gt: new Date() } },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        requests: { where: { status: "CONFIRMED" }, select: { id: true } },
      },
    });
    res.json(
      slots.map(({ requests, ...slot }) => ({
        ...slot,
        available: requests.length === 0,
      })),
    );
  });
  router.post("/properties/:id/slots", async (req, res) => {
    viewer(res, ["ADVERTISER"]);
    const data = slotInput.parse(req.body);
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    res.status(201).json(
      await lockedProperty(deps, id(req.params.id), async (tx, p) => {
        owner(res, p);
        if (p.status !== "PUBLISHED")
          throw new HttpError(
            409,
            "Termine lahko dodajate samo objavljenemu oglasu.",
          );
        if (startsAt <= new Date() || endsAt <= startsAt)
          throw new HttpError(
            400,
            "Začetek mora biti v prihodnosti, konec pa po začetku.",
          );
        const overlap = await tx.viewingSlot.findFirst({
          where: {
            propertyId: p.id,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });
        if (overlap)
          throw new HttpError(409, "Termin se prekriva z obstoječim terminom.");
        return tx.viewingSlot.create({
          data: { propertyId: p.id, startsAt, endsAt },
        });
      }),
    );
  });
  router.post("/properties/:id/requests", async (req, res) => {
    const user = viewer(res, ["SEEKER", "ADVERTISER"]);
    const data = z
      .object({
        slotId: z.uuid(),
        message: z.string().trim().max(2000).optional(),
      })
      .strict()
      .parse(req.body);
    res.status(201).json(
      await lockedProperty(deps, id(req.params.id), async (tx, p) => {
        if (p.status !== "PUBLISHED")
          throw new HttpError(409, "Oglas ni več aktiven.");
        if (p.advertiserId === user.id)
          throw new HttpError(
            403,
            "Za lastni oglas ne morete zahtevati ogleda.",
          );
        const slot = await tx.viewingSlot.findFirst({
          where: { id: data.slotId, propertyId: p.id },
          include: {
            requests: { where: { status: "CONFIRMED" }, select: { id: true } },
          },
        });
        if (!slot || slot.startsAt <= new Date() || slot.requests.length)
          throw new HttpError(409, "Termin ni več na voljo.");
        const existing = await tx.viewingRequest.findUnique({
          where: { slotId_seekerId: { slotId: slot.id, seekerId: user.id } },
        });
        if (existing)
          throw new HttpError(409, "Za ta termin že imate zahtevo.");
        return tx.viewingRequest.create({
          data: {
            slotId: slot.id,
            seekerId: user.id,
            message: data.message,
            status: "PENDING",
          },
        });
      }),
    );
  });
  router.get("/my/requests", async (_req, res) => {
    const user = viewer(res, ["SEEKER", "ADVERTISER"]);
    const requests = await deps.db.viewingRequest.findMany({
      where: { seekerId: user.id },
      include: requestInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(requests.map(requestView));
  });
  router.get("/my/requests/:id", async (req, res) => {
    const user = viewer(res, ["SEEKER", "ADVERTISER"]);
    const value = await deps.db.viewingRequest.findFirst({
      where: { id: id(req.params.id), seekerId: user.id },
      include: requestInclude,
    });
    if (!value) throw new HttpError(404, "Zahteva ne obstaja.");
    res.json(requestView(value));
  });
  router.get("/properties/:id/requests", async (req, res) => {
    const user = viewer(res, ["ADVERTISER"]);
    const p = await deps.db.property.findUnique({
      where: { id: id(req.params.id) },
    });
    if (!p) throw new HttpError(404, "Oglas ne obstaja.");
    owner(res, p);
    res.json(
      await deps.db.viewingRequest.findMany({
        where: { slot: { propertyId: p.id } },
        include: {
          slot: { select: { startsAt: true, endsAt: true } },
          seeker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    );
  });
  router.post(
    "/properties/:id/requests/:requestId/decision",
    async (req, res) => {
      viewer(res, ["ADVERTISER"]);
      const { decision } = z
        .object({ decision: z.enum(["confirm", "reject"]) })
        .strict()
        .parse(req.body);
      res.json(
        await lockedProperty(deps, id(req.params.id), async (tx, p) => {
          owner(res, p);
          if (p.status !== "PUBLISHED")
            throw new HttpError(409, "Oglas ni več aktiven.");
          const value = await tx.viewingRequest.findFirst({
            where: { id: id(req.params.requestId), slot: { propertyId: p.id } },
            include: { slot: true },
          });
          if (
            !value ||
            value.status !== "PENDING" ||
            value.slot.startsAt <= new Date()
          )
            throw new HttpError(409, "O tej zahtevi ni več mogoče odločati.");
          const now = new Date();
          if (decision === "confirm") {
            const booked = await tx.viewingRequest.findFirst({
              where: { slotId: value.slotId, status: "CONFIRMED" },
            });
            if (booked) throw new HttpError(409, "Termin je že rezerviran.");
            await tx.viewingRequest.update({
              where: { id: value.id },
              data: { status: "CONFIRMED", decidedAt: now },
            });
            await tx.viewingRequest.updateMany({
              where: {
                slotId: value.slotId,
                status: "PENDING",
                id: { not: value.id },
              },
              data: { status: "REJECTED", decidedAt: now },
            });
          } else
            await tx.viewingRequest.update({
              where: { id: value.id },
              data: { status: "REJECTED", decidedAt: now },
            });
          return tx.viewingRequest.findUniqueOrThrow({
            where: { id: value.id },
          });
        }),
      );
    },
  );
  router.post("/properties/:id/close", async (req, res) => {
    viewer(res, ["ADVERTISER"]);
    const { status } = z
      .object({ status: z.enum(["INACTIVE", "SOLD", "RENTED"]) })
      .strict()
      .parse(req.body);
    res.json(
      await lockedProperty(deps, id(req.params.id), async (tx, p) => {
        owner(res, p);
        if (p.status !== "PUBLISHED")
          throw new HttpError(409, "Zaključite lahko samo objavljen oglas.");
        if (
          (status === "SOLD" && p.listingType !== "SALE") ||
          (status === "RENTED" && p.listingType !== "RENT")
        )
          throw new HttpError(
            400,
            "Izbrani zaključek ne ustreza namenu oglasa.",
          );
        const now = new Date();
        const property = await tx.property.update({
          where: { id: p.id },
          data: { status },
        });
        await tx.viewingRequest.updateMany({
          where: {
            slot: { propertyId: p.id, startsAt: { gt: now } },
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          data: { status: "CANCELLED", decidedAt: now },
        });
        return property;
      }),
    );
  });
  return router;
}
