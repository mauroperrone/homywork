// server/replitAuth.ts
import passport from "passport";
import session from "express-session";
import type {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import connectPg from "connect-pg-simple";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { db } from "./db/db";
import { users, UserRole } from "@shared/schema";
import { eq } from "drizzle-orm";

/** ENV obbligatorie */
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET missing");
if (!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID missing");
if (!process.env.GOOGLE_CLIENT_SECRET)
  throw new Error("GOOGLE_CLIENT_SECRET missing");
if (!process.env.GOOGLE_REDIRECT_URL)
  throw new Error("GOOGLE_REDIRECT_URL missing");

/** Costanti ruoli iniziali */
// admin fisso
const ADMIN_EMAIL = "mauro@homywork.net";

// host fissati (per ora)
const HOST_EMAILS: string[] = ["allamape2007@gmail.com"];

/** Tipo utente salvato in sessione */
export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: UserRole;
};

/** Sessione con Postgres (montata PRIMA di Passport) */
export function getSession(): RequestHandler {
  const PgStore = connectPg(session);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  return session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
      createTableIfMissing: true,
      ttl: oneWeek,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: oneWeek,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    name: "sid",
  });
}

/** Setup Google OAuth2 (montato DOPO la sessione) */
export async function setupAuth(app: Express) {
  // salviamo in sessione direttamente l'oggetto utente che usiamo nel backend
  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_REDIRECT_URL!,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          if (!email) {
            return done(
              new Error("Google account has no email, cannot create user"),
            );
          }

          const name = profile.displayName ?? null;
          const picture = profile.photos?.[0]?.value ?? null;

          // ruolo di base
          let role: UserRole = "guest";

          // override iniziale basato sull'email
          if (email === ADMIN_EMAIL) {
            role = "admin";
          } else if (HOST_EMAILS.includes(email)) {
            role = "host";
          }

          // cerchiamo utente nel DB
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          let dbUser: SessionUser;

          if (existing.length > 0) {
            let u = existing[0];

            // se il ruolo nel DB è null o diverso, lo aggiorniamo a quello calcolato
            if (!u.role || u.role !== role) {
              const updated = await db
                .update(users)
                .set({
                  name,
                  picture,
                  role,
                })
                .where(eq(users.id, u.id))
                .returning();

              u = updated[0];
            }

            dbUser = {
              id: u.id,
              email: u.email,
              name: u.name ?? null,
              picture: u.picture ?? null,
              role: (u.role as UserRole) ?? "guest",
            };
          } else {
            // utente nuovo → insert
            const inserted = await db
              .insert(users)
              .values({
                id: profile.id, // usiamo l'id Google come primary key
                email,
                name,
                picture,
                role,
              })
              .returning();

            const u = inserted[0];

            dbUser = {
              id: u.id,
              email: u.email,
              name: u.name ?? null,
              picture: u.picture ?? null,
              role: (u.role as UserRole) ?? "guest",
            };
          }

          return done(null, dbUser);
        } catch (err) {
          console.error("GoogleStrategy error", err);
          return done(err as any);
        }
      },
    ),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // login
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["openid", "profile", "email"],
      prompt: "consent",
    }),
  );

  // callback
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req: Request, res: Response) => {
      const returnTo = (req.session as any).returnTo || "/";
      delete (req.session as any).returnTo;
      res.redirect(returnTo);
    },
  );

  // logout
  app.post("/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      // @ts-ignore
      req.session.destroy(() => res.redirect("/"));
    });
  });

  // ⚠️ RIMOSSO /auth/me
  // L'endpoint per l'utente corrente lo gestiamo in meRoute.ts come /api/me
}

/** Middleware di autorizzazione base */
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const anyReq = req as any;
  if (
    typeof anyReq.isAuthenticated === "function" &&
    anyReq.isAuthenticated()
  ) {
    return next();
  }
  return res.status(401).json({ error: "Unauthenticated" });
}

/** Middleware per ruoli specifici */
export function requireRole(required: UserRole | UserRole[]) {
  const requiredRoles = Array.isArray(required) ? required : [required];

  return (req: Request, res: Response, next: NextFunction) => {
    const anyReq = req as any;
    const user: SessionUser | undefined = anyReq.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    if (!requiredRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

// helper dedicati
export const isGuest = requireRole("guest");
export const isHost = requireRole("host");
export const isAdmin = requireRole("admin");








