// server/index.ts
import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";

import { getSession, setupAuth } from "./replitAuth";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startScheduler } from "./scheduler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// In produzione dietro proxy (Render/Heroku/etc.) abilita cookie secure
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// mini-logger per /api
app.use((req, res, next) => {
  const start = Date.now();
  const pathx = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  (res as any).json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathx.startsWith("/api")) {
      let logLine = `${req.method} ${pathx} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {}
      }
      if (logLine.length > 180) logLine = logLine.slice(0, 179) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  // 1) Sessione PRIMA di tutto
  app.use(getSession());

  // 2) Auth Google
  await setupAuth(app);

  // 3) Route app/API
  const server = await registerRoutes(app);

  // 4) Scheduler
  startScheduler();

  // 5) Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // 6) Dev vs Prod
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 7) Avvio
  const port = parseInt(process.env.PORT || "5050", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();

