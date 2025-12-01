// server/routes.ts
import type { Express } from "express";
import http from "http";
import meRoute from "./meRoute";
import { isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express) {
  // Health check base
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Rotte che richiedono utente loggato
  app.use("/api", isAuthenticated, meRoute);
  // -> /api/me

  // Qui in futuro monteremo:
  // - /api/properties (host/guest)
  // - /api/bookings
  // - /api/admin/* (protette da isAdmin)
  // ecc.

  const server = http.createServer(app);
  return server;
}


