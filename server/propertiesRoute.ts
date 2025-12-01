// server/propertiesRoute.ts
import { Router, Request, Response } from "express";
import { db } from "./db/db";
import { properties } from "@shared/schema";
import { and, eq, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getSessionUser, type SessionUser } from "./replitAuth";

/**
 * Utenti "speciali" per ruoli (fino a quando non faremo una gestione ruoli seria via admin panel)
 */
const ADMIN_EMAIL = "mauro@homywork.net";
const HOST_EMAILS: string[] = ["allamape2007@gmail.com"];

const router = Router();

/**
 * GET /api/properties
 * Endpoint pubblico: lista immobili attivi, con filtri base opzionali:
 *  - ?city=Lucca
 *  - ?maxPrice=100 (euro per notte)
 */
router.get("/properties", async (req: Request, res: Response) => {
  try {
    const { city, maxPrice } = req.query;

    const conditions = [eq(properties.isActive, true)];

    if (typeof city === "string" && city.trim() !== "") {
      conditions.push(eq(properties.city, city.trim()));
    }

    let maxPriceCents: number | undefined;
    if (typeof maxPrice === "string" && maxPrice.trim() !== "") {
      const parsed = Number(maxPrice);
      if (!Number.isNaN(parsed) && parsed > 0) {
        maxPriceCents = Math.round(parsed * 100);
        conditions.push(lte(properties.pricePerNightCents, maxPriceCents));
      }
    }

    const whereCondition =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const rows = await db.select().from(properties).where(whereCondition);

    const result = rows.map((p) => ({
      id: p.id,
      hostId: p.hostId,
      title: p.title,
      description: p.description,
      city: p.city,
      address: p.address,
      pricePerNight: p.pricePerNightCents / 100,
      maxGuests: p.maxGuests,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return res.json({ properties: result });
  } catch (err) {
    console.error("GET /api/properties error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Middleware: richiede host o admin, dedotti dall'email
 */
const requireHostOrAdmin = (req: Request, res: Response, next: Function) => {
  const user = getSessionUser(req);

  if (!user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  let role: "guest" | "host" | "admin" = "guest";

  if (user.email === ADMIN_EMAIL) {
    role = "admin";
  } else if (HOST_EMAILS.includes(user.email)) {
    role = "host";
  } else {
    role = user.role;
  }

  if (role === "host" || role === "admin") {
    return next();
  }

  return res.status(403).json({ error: "Forbidden" });
};

/**
 * GET /api/host/properties
 * Lista immobili dell'host loggato.
 */
router.get(
  "/host/properties",
  requireHostOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const user = getSessionUser(req) as SessionUser;

      const rows = await db
        .select()
        .from(properties)
        .where(eq(properties.hostId, user.id));

      const result = rows.map((p) => ({
        id: p.id,
        hostId: p.hostId,
        title: p.title,
        description: p.description,
        city: p.city,
        address: p.address,
        pricePerNight: p.pricePerNightCents / 100,
        maxGuests: p.maxGuests,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      return res.json({ properties: result });
    } catch (err) {
      console.error("GET /api/host/properties error", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/host/properties
 * Crea un nuovo immobile per l'host loggato (o admin).
 */
router.post(
  "/host/properties",
  requireHostOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const user = getSessionUser(req) as SessionUser;

      const {
        title,
        description,
        city,
        address,
        pricePerNight,
        maxGuests,
      } = req.body ?? {};

      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Title is required" });
      }

      if (
        pricePerNight === undefined ||
        typeof pricePerNight !== "number" ||
        pricePerNight <= 0
      ) {
        return res
          .status(400)
          .json({ error: "pricePerNight must be a positive number (euro)" });
      }

      if (
        maxGuests === undefined ||
        typeof maxGuests !== "number" ||
        maxGuests <= 0
      ) {
        return res
          .status(400)
          .json({ error: "maxGuests must be a positive number" });
      }

      const id = randomUUID();
      const now = new Date();

      const [inserted] = await db
        .insert(properties)
        .values({
          id,
          hostId: user.id,
          title,
          description: description ?? null,
          city: city ?? null,
          address: address ?? null,
          pricePerNightCents: Math.round(pricePerNight * 100),
          maxGuests,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const result = {
        id: inserted.id,
        hostId: inserted.hostId,
        title: inserted.title,
        description: inserted.description,
        city: inserted.city,
        address: inserted.address,
        pricePerNight: inserted.pricePerNightCents / 100,
        maxGuests: inserted.maxGuests,
        isActive: inserted.isActive,
        createdAt: inserted.createdAt,
        updatedAt: inserted.updatedAt,
      };

      return res.status(201).json({ property: result });
    } catch (err) {
      console.error("POST /api/host/properties error", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
