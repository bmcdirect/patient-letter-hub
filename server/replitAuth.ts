import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
    name: 'sessionId',
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  const sessionMiddleware = getSession();
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, cb) => {
    console.log("Serializing user:", user.id);
    cb(null, user);
  });
  passport.deserializeUser((user: any, cb) => {
    console.log("Deserializing user:", user.id);
    cb(null, user);
  });

  // ⚠️ Dev-only GET login route (disabled)
  /*
  app.get("/api/login", async (req, res) => {
    try {
      console.log("Login attempt started");

      let testUser;
      try {
        testUser = await storage.upsertUser({
          id: "test123",
          email: "test123@patientletterhub.com",
          firstName: "Test",
          lastName: "User",
          profileImageUrl: null,
        });
        console.log("Test user created/updated successfully");
      } catch (dbError) {
        console.error("Database error during user creation:", dbError);
        testUser = {
          id: "test123",
          email: "test123@patientletterhub.com",
          firstName: "Test",
          lastName: "User",
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log("Using fallback test user");
      }

      req.login({
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName
      }, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        console.log("Login successful, session ID:", req.sessionID);
        console.log("Session data:", req.session);

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Session save failed" });
          }
          console.log("Session saved, redirecting to dashboard");
          res.redirect("/");
        });
      });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  */

  // ⚠️ Dev login route disabled for live authentication testing
  /*
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (username === "test123" && password === "MCI123") {
        let testUser;
        try {
          testUser = await storage.upsertUser({
            id: "test123",
            email: "test123@patientletterhub.com",
            firstName: "Test",
            lastName: "User",
            profileImageUrl: null,
          });
        } catch (dbError) {
          console.error("Database error during user creation:", dbError);
          testUser = {
            id: "test123",
            email: "test123@patientletterhub.com",
            firstName: "Test",
            lastName: "User",
            profileImageUrl: null,
          };
        }

        req.login({
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        }, (err) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          console.log("Test user login successful");
          res.json({ success: true });
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("POST login failed:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  */

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  console.log("Auth check - Session ID:", req.sessionID);
  console.log("Auth check - isAuthenticated():", req.isAuthenticated());
  console.log("Auth check - User:", req.user);
  console.log("Auth check - Session:", req.session);

  if (!req.isAuthenticated() || !req.user) {
    console.log("Authentication failed - no user or not authenticated");
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log("Authentication successful");
  return next();
};
