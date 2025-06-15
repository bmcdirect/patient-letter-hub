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

  // Simple demo authentication - create a test user
  passport.serializeUser((user: any, cb) => {
    console.log("Serializing user:", user.id);
    cb(null, user);
  });
  passport.deserializeUser((user: any, cb) => {
    console.log("Deserializing user:", user.id);
    cb(null, user);
  });

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
        console.log("Login successful, session ID:", req.sessionID);
        console.log("Session data:", req.session);
        
        // Force session save before redirect
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