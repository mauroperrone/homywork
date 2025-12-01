// server/meRoute.ts
import { Router, Request, Response } from "express";
import { SessionUser } from "./replitAuth";

const router = Router();

router.get("/me", (req: Request, res: Response) => {
  const anyReq = req as any;
  const user: SessionUser | undefined = anyReq.user;

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.json({
    user,
  });
});

export default router;

