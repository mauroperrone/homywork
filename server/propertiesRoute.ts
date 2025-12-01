// server/propertiesRoute.ts
import { Router, Request, Response } from "express";
import { db } from "./db/db";
import { properties } from "@shared/schema";
import { and, eq, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Utente di sessione minimo come lo mette passport (replitAuth)
 */
type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

// stessi override email che usiamo in meRoute
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

    // condizioni base: solo immobili attivi
    const conditions = [eq(properties.isActive, true)];

    // filtro città (match esatto semplice)
    if (typeof city === "string" && city.trim() !== "") {
      conditions.push(eq(properties.city, city.trim()));
    }

    // filtro maxPrice (in euro → convertiamo in centesimi)
    let maxPriceCents: number | undefined;
    if (typeof maxPrice === "string" && maxPrice.trim() !== "") {
      const parsed = Number(maxPrice);
      if (!Number.isNaN(parsed) && parsed > 0) {
        maxPriceCents = Math.round(parsed * 100);
        conditions.push(lte(properties.pricePerNightCents, maxPriceCents));
      }
    }

    // costruiamo la WHERE finale
    const whereCondition =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const rows = await db
      .select()
      .from(properties)
      .where(whereCondition);

    // Convertiamo il prezzo da centesimi a euro per il frontend
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
 * Middleware interno: richiede host OPPURE admin.
 * Il ruolo viene dedotto dall'email come in meRoute.
 */
const requireHostOrAdmin = (req: Request, res: Response, next: Function) => {
  const anyReq = req as any;
  const user: SessionUser | undefined = anyReq.user;

  if (!user || !user.email) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  let role: "guest" | "host" | "admin" = "guest";

  if (user.email === ADMIN_EMAIL) {
    role = "admin";
  } else if (HOST_EMAILS.includes(user.email)) {
    role = "host";
  }

  if (role === "host" || role === "admin") {
    return next();
  }

  return res.status(403).json({ error: "Forbidden" });
};

/**
 * GET /api/host/properties
 * Lista immobili dell'host (o dell'admin: gli mostriamo i suoi eventuali immobili).
 */
router.get(
  "/host/properties",
  requireHostOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const anyReq = req as any;
      const user: SessionUser = anyReq.user;

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
 * Body JSON atteso:
 * {
 *   "title": string,
 *   "description": string,
 *   "city": string,
 *   "address": string,
 *   "pricePerNight": number,   // in euro
 *   "maxGuests": number
 * }
 */
router.post(
  "/host/properties",
  requireHostOrAdmin,
  async (req: Request, res: Response) => {
    try {
      const anyReq = req as any;
      const user: SessionUser = anyReq.user;

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
