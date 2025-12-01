// server/index.ts
import express from "express";
import cors from "cors";
import routes from "./routes";
import { setupAuth } from "./replitAuth";

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Middleware base
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  }),
);
app.use(express.json());

// Auth (sessioni + Google)
setupAuth(app);

// API
app.use("/api", routes);

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
