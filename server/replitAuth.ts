import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { db } from "./db";

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

  // For now, we'll implement a simple authentication mechanism
  // In production, this would be replaced with proper Replit OpenID Connect
  console.log("Authentication setup: Simple mode for development/testing");

  passport.serializeUser((user: any, cb) => {
    console.log("Serializing user:", user.id);
    cb(null, user.id);
  });
  passport.deserializeUser(async (id: string, cb) => {
    console.log("Deserializing user:", id);
    try {
      const user = await storage.getUser(id);
      if (user) {
        console.log("User found during deserialization:", user.id);
        cb(null, user);
      } else {
        console.log("User not found during deserialization:", id);
        cb(null, false);
      }
    } catch (error) {
      console.error("Error during user deserialization:", error);
      cb(error, null);
    }
  });

  // GET /api/login route for OAuth initiation (enabled for testing)
  app.get("/api/login", async (req, res) => {
    try {
      console.log("Login attempt started");

      // For development, we'll create or find a test user in the database
      let testUser;
      try {
        // First try to find existing test user
        const existingUser = await db.execute(`SELECT * FROM users WHERE email = 'test123@patientletterhub.com' LIMIT 1`);
        
        if (existingUser.rows.length > 0) {
          testUser = existingUser.rows[0];
          console.log("Found existing test user:", testUser.id);
        } else {
          // Create new test user with auto-generated ID
          const newUser = await db.execute(
            `INSERT INTO users (email, password_hash, first_name, last_name) 
             VALUES ('test123@patientletterhub.com', 'dummy_hash', 'Test', 'User')
             RETURNING id, email, first_name, last_name`
          );
          testUser = newUser.rows[0];
          console.log("Created new test user:", testUser.id);
        }
      } catch (dbError) {
        console.error("Database error during user creation:", dbError);
        return res.status(500).json({ error: "Database error during authentication" });
      }

      req.login({
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.first_name,
        lastName: testUser.last_name
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
          res.redirect("/dashboard");
        });
      });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

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

  // Temporary authentication routes for development
  app.get("/api/auth/login", async (req, res) => {
    try {
      // Use a fixed test user that we know exists
      const testUser = {
        id: "dev-user-1750356001255",
        email: "developer@patientletterhub.com",
        firstName: "Test",
        lastName: "Developer",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      req.login(testUser, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        console.log("Development login successful for user:", testUser.id);
        res.redirect("/");
      });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  
  app.get("/api/auth/callback", (req, res) => {
    res.redirect("/");
  });

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
  console.log("Auth check - User:", req.user);
  console.log("Auth check - Session:", req.session);

  if (!req.user) {
    console.log("Authentication failed - no user or not authenticated");
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log("Authentication successful");
  return next();
};
