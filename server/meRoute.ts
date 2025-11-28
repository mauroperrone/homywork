// server/meRoute.ts
import { Router, Request, Response } from "express";
import { db } from "./db/db";
import { users, UserRole } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// admin fisso
const ADMIN_EMAIL = "mauro@homywork.net";

// host fissati (per ora)
const HOST_EMAILS: string[] = ["allamape2007@gmail.com"];

router.get("/me", async (req: Request, res: Response) => {
  try {
    // Usiamo ciò che la tua auth mette su req.user
    const authUser = (req as any).user;

    if (!authUser || !authUser.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const email: string = authUser.email;
    const name: string | undefined = authUser.name;
    const picture: string | undefined = authUser.picture;

    // Proviamo a leggere l'utente dal DB per email
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(eq(users.email, email));

    let id: string | null = null;
    let role: UserRole = "guest";

    if (rows.length > 0) {
      id = rows[0].id;
      role = (rows[0].role as UserRole | null) ?? "guest";
    } else {
      // Utente non presente a DB: gli diamo un id placeholder
      id = email; // al frontend per ora basta
      role = "guest";
    }

    // override ruoli basato sull'email
    if (email === ADMIN_EMAIL) {
      role = "admin";
    } else if (HOST_EMAILS.includes(email)) {
      role = "host";
    }

    return res.json({
      id,
      email,
      name: name ?? null,
      picture: picture ?? null,
      role
    });
  } catch (err) {
    console.error("/api/me error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
