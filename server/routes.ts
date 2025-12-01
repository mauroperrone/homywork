// server/routes.ts
import type { Express } from "express";
import http from "http";
import meRoute from "./meRoute";
import propertiesRoute from "./propertiesRoute";
import { isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express) {
  // Health check base
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Rotte che richiedono utente loggato
  app.use("/api", isAuthenticated, meRoute);
  // -> /api/me

  // Rotte per immobili:
  // - GET /api/properties (pubblico)
  // - GET /api/host/properties (host/admin)
  // - POST /api/host/properties (host/admin)
  app.use("/api", propertiesRoute);

  const server = http.createServer(app);
  return server;
}
