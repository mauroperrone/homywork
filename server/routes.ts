// server/routes.ts
import type { Express } from "express";
import http from "http";
import meRoute from "./meRoute";
import propertiesRoute from "./propertiesRoute";

export async function registerRoutes(app: Express) {
  // Health check base
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Rotte per immobili:
  // - GET /api/properties (pubblico)
  // - GET /api/host/properties (host/admin, protetto in propertiesRoute)
  // - POST /api/host/properties (host/admin, protetto in propertiesRoute)
  app.use("/api", propertiesRoute);

  // Rotta /api/me (usa il controllo interno su req.user)
  app.use("/api", meRoute);

  const server = http.createServer(app);
  return server;
}


