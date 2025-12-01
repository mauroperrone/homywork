// server/replitAuth.ts
import passport from "passport";
import session from "express-session";
import type { Express, Request } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { db } from "./db/db";
import { users, type User } from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET missing");
if (!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID missing");
if (!process.env.GOOGLE_CLIENT_SECRET)
  throw new Error("GOOGLE_CLIENT_SECRET missing");
if (!process.env.GOOGLE_CALLBACK_URL)
  throw new Error("GOOGLE_CALLBACK_URL missing");

const PgStore = connectPg(session);

/**
 * Utente minimo che teniamo in sessione
 */
export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  role: "guest" | "host" | "admin";
};

export function setupAuth(app: Express) {
  // Sessioni persistenti su Postgres (Neon)
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // su Render dietro proxy va bene così, se metti HTTPS diretto cambiamo
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize: salviamo solo l'id
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize: carichiamo l'utente dal DB
  passport.deserializeUser(async (id: string, done) => {
    try {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      const user = rows[0];
      if (!user) {
        return done(null, false);
      }

      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture ?? undefined,
        role: (user.role as SessionUser["role"]) ?? "guest",
      };

      done(null, sessionUser);
    } catch (err) {
      done(err as any);
    }
  });

  // Strategia Google
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const picture = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email from Google"), undefined as any);
          }

          // Controlliamo se esiste già
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.id, googleId))
            .limit(1);

          let user: User;

          if (existing[0]) {
            // update base
            const [updated] = await db
              .update(users)
              .set({
                email,
                name,
                picture,
              })
              .where(eq(users.id, googleId))
              .returning();
            user = updated;
          } else {
            // ruolo base: guest
            const [inserted] = await db
              .insert(users)
              .values({
                id: googleId,
                email,
                name,
                picture,
                role: "guest",
              })
              .returning();
            user = inserted;
          }

          const sessionUser: SessionUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture ?? undefined,
            role: (user.role as SessionUser["role"]) ?? "guest",
          };

          done(null, sessionUser);
        } catch (err) {
          done(err as any, undefined as any);
        }
      },
    ),
  );

  // Route auth
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/auth/failure",
    }),
    (req, res) => {
      res.redirect("/"); // dopo login torna in home
    },
  );

  app.get("/auth/failure", (_req, res) => {
    res.status(401).send("Google authentication failed");
  });

  app.post("/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.status(200).json({ ok: true });
      });
    });
  });
}

/**
 * Helper per leggere l'utente da req
 */
export function getSessionUser(req: Request): SessionUser | undefined {
  const anyReq = req as any;
  return anyReq.user as SessionUser | undefined;
}
