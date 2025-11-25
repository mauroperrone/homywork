// server/routes.ts
import type { Express } from "express";
import http from "http";

export async function registerRoutes(app: Express) {
  // Esempio API base (lascia/aggiungi le tue API reali qui)
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Crea e ritorna il server HTTP (serve a Vite in dev e all'avvio in prod)
  const server = http.createServer(app);
  return server;
}

