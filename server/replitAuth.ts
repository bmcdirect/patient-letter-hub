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
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Simple demo authentication - create a test user
  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Login route - creates a demo user session
  app.get("/api/login", async (req, res) => {
    try {
      console.log("Login attempt started");
      
      // Create a demo user for testing with retry logic
      let demoUser;
      try {
        demoUser = await storage.upsertUser({
          id: "demo-user-123",
          email: "demo@patientletterhub.com",
          firstName: "Demo",
          lastName: "User",
          profileImageUrl: null,
        });
        console.log("Demo user created/updated successfully");
      } catch (dbError) {
        console.error("Database error during user creation:", dbError);
        // Fallback - create user object without database storage for demo
        demoUser = {
          id: "demo-user-123",
          email: "demo@patientletterhub.com",
          firstName: "Demo",
          lastName: "User",
          profileImageUrl: null,
          creditBalance: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        };
        console.log("Using fallback demo user");
      }

      req.login({ 
        id: demoUser.id,
        email: demoUser.email,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName 
      }, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        console.log("Login successful, redirecting to dashboard");
        res.redirect("/");
      });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
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
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};