// server/meRoute.ts
import { Router, Request, Response } from "express";
import { db } from "./db/db";
import { users, UserRole } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

const ADMIN_EMAIL = "mauro@homywork.net";

router.get("/me", async (req: Request, res: Response) => {
  try {
    // Qui NON usiamo più JWT o cookie "session"
    // Usiamo quello che la tua auth già mette su req (es. passport).
    const authUser = (req as any).user;

    if (!authUser || !authUser.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const email: string = authUser.email;
    const name: string | undefined = authUser.name;
    const picture: string | undefined = authUser.picture;

    // Cerchiamo l'utente nel DB per email
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    let finalRole: UserRole = "guest";
    let id: string;

    if (existing.length === 0) {
      // Se non esiste ancora nel DB, lo creiamo adesso.
      finalRole = email === ADMIN_EMAIL ? "admin" : "guest";
      // usiamo l'email come id logico se il tuo schema lo consente,
      // altrimenti, se il tuo schema prevede un altro id, adattalo.
      id = email;

      await db.insert(users).values({
        id,
        email,
        name,
        picture,
        role: finalRole
      });

      console.log(`[meRoute] Creato utente ${email} con ruolo ${finalRole}`);
    } else {
      const u = existing[0];
      id = u.id;
      // Se nel DB non c'è il ruolo, lo normalizziamo a guest/admin.
      let roleFromDb = (u.role as UserRole | null) ?? "guest";

      if (email === ADMIN_EMAIL && roleFromDb !== "admin") {
        roleFromDb = "admin";
        await db
          .update(users)
          .set({ role: roleFromDb })
          .where(eq(users.id, u.id));
        console.log(
          `[meRoute] Aggiornato ruolo di ${email} da ${u.role} a admin`
        );
      }

      finalRole = roleFromDb;
    }

    return res.json({
      id,
      email,
      name,
      picture,
      role: finalRole
    });
  } catch (err) {
    console.error("/api/me error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;



