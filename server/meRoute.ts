// server/meRoute.ts
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db/db";
import { users, UserRole } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

interface SessionTokenPayload {
  sub: string;
  email: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

router.get("/me", async (req: Request, res: Response) => {
  try {
    // NB: qui assumiamo che qualche middleware (session / cookie-parser)
    // abbia già messo i cookie su req. Se non c'è cookie "session",
    // rispondiamo 401.
    const token = (req as any).cookies?.session;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as SessionTokenPayload;

    if (!decoded?.sub) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        picture: users.picture,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, decoded.sub));

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result[0];

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: (user.role as UserRole) || "guest"
    });
  } catch (err) {
    console.error("/api/me error", err);
    return res.status(401).json({ error: "Invalid or expired session" });
  }
});

export default router;


