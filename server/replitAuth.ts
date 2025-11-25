// server/replitAuth.ts
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import type {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import connectPg from "connect-pg-simple";

/**
 * VARIABILI D'AMBIENTE OBBLIGATORIE
 */
if (!process.env.DATABASE_URL) {
  throw new Error("Environment variable DATABASE_URL not provided");
}
if (!process.env.SESSION_SECRET) {
  throw new Error("Environment variable SESSION_SECRET not provided");
}
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Environment variable GOOGLE_CLIENT_ID not provided");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Environment variable GOOGLE_CLIENT_SECRET not provided");
}
if (!process.env.GOOGLE_CALLBACK_URL) {
  throw new Error("Environment variable GOOGLE_CALLBACK_URL not provided");
}

/**
 * SESSIONE CON POSTGRES (connect-pg-simple)
 */
export function getSession(): RequestHandler {
  const PgStore = connectPg(session);
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 giorni

  const store = new PgStore({
    conString: process.env.DATABASE_URL,
    tableName: "sessions", // Assicurati che la tabella esista
    createTableIfMissing: false, // metti true se vuoi l'auto-creazione
    ttl: sessionTtlMs,
  });

  const isProd = process.env.NODE_ENV === "production";

  return session({
    store,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: sessionTtlMs,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd, // in produzione serve HTTPS + app.set('trust proxy', 1)
    },
  });
}

/**
 * SETUP GOOGLE OAUTH 2.0 (passport-google-oauth20)
 */
export async function setupAuth(app: Express) {
  // Strategia Google
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!, // es. http://localhost:5050/auth/google/callback
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const user = {
            id: profile.id,
            email: profile.emails?.[0]?.value ?? null,
            name: profile.displayName ?? null,
            picture: profile.photos?.[0]?.value ?? null,
            provider: "google",
          };
          // TODO: qui potresti sincronizzare su DB se ti serve
          return done(null, user);
        } catch (err) {
          return done(err as any, undefined);
        }
      }
    )
  );

  // Serialize/deserialize utente in sessione
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj: any, done) => {
    done(null, obj);
  });

  // Inizializza passport + sessione
  app.use(passport.initialize());
  app.use(passport.session());

  // Rotta di login (redirect a Google)
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  // Callback di Google
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/auth/login-failed",
      successReturnToOrRedirect: "/",
    })
  );

  // Logout (invalida sessione)
  app.post("/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.redirect("/");
      });
    });
  });

  // Info utente corrente (per il client)
  app.get("/auth/me", (req, res) => {
    if (!req.user) return res.status(401).json({ user: null });
    res.json({ user: req.user });
  });
}

/**
 * MIDDLEWARE DI AUTORIZZAZIONE (se/quando servono ruoli)
 */
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const anyReq = req as any;
  if (typeof anyReq.isAuthenticated === "function" && anyReq.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthenticated" });
}
export function isHost(req: Request, res: Response, next: NextFunction) {
  return isAuthenticated(req, res, next);
}
export function isGuest(req: Request, res: Response, next: NextFunction) {
  return isAuthenticated(req, res, next);
}
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  return isAuthenticated(req, res, next);
}




