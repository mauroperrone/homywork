// server/replitAuth.ts
import * as openid from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";

if (!process.env.DATABASE_URL) throw new Error("Environment variable DATABASE_URL not provided");
if (!process.env.SESSION_SECRET) throw new Error("Environment variable SESSION_SECRET not provided");
if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Environment variable GOOGLE_CLIENT_ID not provided");
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("Environment variable GOOGLE_CLIENT_SECRET not provided");
if (!process.env.GOOGLE_REDIRECT_URL) throw new Error("Environment variable GOOGLE_REDIRECT_URL not provided");

function getIssuerConstructor(): any {
  const anyOpenid = openid as any;
  return anyOpenid.Issuer || anyOpenid.default?.Issuer;
}

const getOidcClient = memoize(
  async () => {
    const IssuerCtor = getIssuerConstructor();
    if (!IssuerCtor) {
      throw new Error("openid-client: Issuer constructor not found on module.");
    }
    const googleIssuer = await IssuerCtor.discover("https://accounts.google.com");
    const oidcClient = new googleIssuer.Client({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uris: [process.env.GOOGLE_REDIRECT_URL!], // *** QUI usa l'URL di Render ***
      response_types: ["code"],
    });
    return oidcClient;
  },
  { maxAge: 3600 * 1000 }
);

export function getSession(): RequestHandler {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 settimana
  const PgStore = connectPg(session);
  const store = new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isProd = process.env.NODE_ENV === "production";

  return session({
    store,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: sessionTtl,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd, // *** cookie solo secure in prod (HTTPS su Render) ***
    },
    name: "sid",
  });
}

export async function setupAuth(app: Express) {
  const oidcClient = await getOidcClient();

  const verify: VerifyFunction = (_tokenset, userinfo, done) => {
    const info: any = userinfo || {};
    const user = {
      id: info.sub,
      email: info.email,
      name: info.name,
      picture: info.picture,
      provider: "google",
    };
    return done(null, user);
  };

  const strategy = new Strategy({ client: oidcClient, passReqToCallback: false }, verify);
  passport.use("google", strategy);

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/auth/google", passport.authenticate("google", { scope: ["openid", "profile", "email"] }));

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/auth/login-failed",
      successReturnToOrRedirect: "/",
    })
  );

  app.post("/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => res.redirect("/"));
    });
  });

  app.get("/auth/me", (req, res) => {
    if (!req.user) return res.status(401).json({ user: null });
    res.json({ user: req.user });
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const anyReq = req as any;
  if (typeof anyReq.isAuthenticated === "function" && anyReq.isAuthenticated()) return next();
  return res.status(401).json({ error: "Unauthenticated" });
}
export const isHost = isAuthenticated;
export const isGuest = isAuthenticated;
export const isAdmin = isAuthenticated;





