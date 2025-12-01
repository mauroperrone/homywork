// server/meRoute.ts
import { Router, Response } from "express";
import type { Request } from "express";
import { getSessionUser } from "./replitAuth";

const router = Router();

/**
 * GET /api/me
 * Ritorna l'utente loggato e il ruolo.
 */
router.get("/me", (req: Request, res: Response) => {
  const user = getSessionUser(req);

  if (!user) {
    return res.status(200).json({ authenticated: false, user: null });
  }

  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
    },
  });
});

export default router;
