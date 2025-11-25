// server/replitAuth.ts
import passport from "passport";
import session from "express-session";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

/** ENV obbligatorie */
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET missing");
if (!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID missing");
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("GOOGLE_CLIENT_SECRET missing");
if (!process.env.GOOGLE_REDIRECT_URL) throw new Error("GOOGLE_REDIRECT_URL missing");

/** Sessione con Postgres (montata PRIMA di Passport) */
export function getSession(): RequestHandler {
  const PgStore = connectPg(session);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  return session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: true, // crea la tabella se manca
      ttl: oneWeek,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: oneWeek,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // in prod serve HTTPS (Render)
    },
    name: "sid",
  });
}

/** Setup Google OAuth2 (montato DOPO la sessione) */
export async function setupAuth(app: Express) {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_REDIRECT_URL!, // deve combaciare 1:1 con Google Console
      },
      (_accessToken, _refreshToken, profile: Profile, done) => {
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value ?? null,
          name: profile.displayName ?? null,
          picture: profile.photos?.[0]?.value ?? null,
          provider: "google" as const,
        };
        return done(null, user);
      }
    )
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // login
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["openid", "profile", "email"], prompt: "consent" })
  );

  // callback
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req: Request, res: Response) => {
      const returnTo = (req.session as any).returnTo || "/";
      delete (req.session as any).returnTo;
      res.redirect(returnTo);
    }
  );

  // logout
  app.post("/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
    // @ts-ignore
      req.session.destroy(() => res.redirect("/"));
    });
  });

  // utente corrente
  app.get("/auth/me", (req, res) => {
    if (!req.user) return res.status(401).json({ user: null });
    res.json({ user: req.user });
  });
}

/** Middleware di autorizzazione base */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const anyReq = req as any;
  if (typeof anyReq.isAuthenticated === "function" && anyReq.isAuthenticated()) return next();
  return res.status(401).json({ error: "Unauthenticated" });
}
export const isHost = isAuthenticated;
export const isGuest = isAuthenticated;
export const isAdmin = isAuthenticated;







