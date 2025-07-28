import * as Sentry from '@sentry/node';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import MemoryStore from "memorystore";
import ConnectSQLite from "connect-sqlite3";
import path from "path";
import fs from "fs";
import { logger } from '../logger';
import { v4 as uuid } from 'uuid';

import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, sanitizeInput, requestSizeLimiter } from "./middleware/security";
import { rateLimiter } from "./middleware/validation";
import { tenantMiddleware } from "./middleware/tenantMiddleware";
import routes from "./routes";
import { backfillPracticeId } from "./scripts/backfillPracticeId";

const app = express();

// Initialize Sentry for error tracking and performance monitoring
Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://YOUR_SENTRY_DSN_HERE@sentry.io/YOUR_PROJECT_ID',
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    // Enable HTTP calls tracing
    Sentry.httpIntegration({ tracing: true }),
    // Enable Express.js middleware tracing
    Sentry.expressIntegration({ app }),
    // Enable database tracing
    Sentry.postgresIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Additional options
  beforeSend(event, hint) {
    // Filter out non-actionable errors in development
    if (process.env.NODE_ENV === 'development') {
      // You can add custom filtering logic here
      logger.info({ event, hint }, 'Sentry event captured');
    }
    return event;
  }
});

// Simplified CORS configuration for single origin serving
const configureSecureCORS = () => {
  // Since we're serving frontend and API from same origin, we only need minimal CORS
  app.use((req, res, next) => {
    // Allow same-origin requests with credentials
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    
    // Security headers for production
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Only set HSTS in production over HTTPS
    if (process.env.NODE_ENV === 'production' || process.env.REPLIT_ENVIRONMENT === 'production') {
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
};

configureSecureCORS();

// Sentry request handler must be the first middleware
// Note: Modern Sentry Node SDK uses automatic instrumentation
// The express integration handles request/response tracking automatically

// Apply security middleware
app.use(securityHeaders);
app.use(requestSizeLimiter);
app.use(sanitizeInput);

// Apply rate limiting for production
if (process.env.NODE_ENV === 'production' || process.env.REPLIT_ENVIRONMENT === 'production') {
  app.use('/api', rateLimiter);
}

app.use(express.json({ limit: '10mb' })); // Set JSON payload limit
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Cookie and session middleware
app.use(cookieParser());

// Ensure data directory exists
const dataDir = path.resolve('./data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Use SQLite store for persistent sessions
const SQLiteStore = ConnectSQLite(session);

// Configure session based on environment
const sessionSecret = process.env.SESSION_SECRET || 'PLEASE_CHANGE_ME';
if (sessionSecret === 'PLEASE_CHANGE_ME') {
  console.warn('⚠️  WARNING: Using default SESSION_SECRET. Please set SESSION_SECRET in production!');
}

const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true, // Save new sessions to ensure cookie is set
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: dataDir
  }),
  cookie: {
    secure: false, // Always false for Replit deployment (uses internal proxy)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' as const, // Perfect for single-origin serving
    // No domain attribute for first-party cookies
  },
  name: 'patient-letter-hub-session' // Unique session name
};

console.log('Session config:', {
  secure: sessionConfig.cookie.secure,
  sameSite: sessionConfig.cookie.sameSite,
  httpOnly: sessionConfig.cookie.httpOnly,
  environment: process.env.NODE_ENV,
  replitEnvironment: process.env.REPLIT_ENVIRONMENT,
  replitDomains: process.env.REPLIT_DOMAINS
});

// Parse cookies before session middleware
app.use(cookieParser());

app.use(session(sessionConfig));

// Add request-scoped logger middleware
app.use((req, res, next) => {
  const reqId = uuid();
  (req as any).log = logger.child({ reqId });
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run backfill script on startup
  try {
    await backfillPracticeId();
  } catch (error) {
    console.error('Failed to run backfill script:', error);
  }

  // Mount clean routes
  app.use(routes);
  
  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);

  // Sentry error handler must be after all routes but before other error handlers
  app.use(Sentry.expressErrorHandler());

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error with contextual information
    (req as any).log?.error({
      error: err,
      status,
      message,
      url: req.url,
      method: req.method,
      userId: req.session?.userId,
      tenantId: (req as any).tenantId
    }, 'Unhandled error');

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    try {
      serveStatic(app);
      log("Production static serving enabled");
      
      // Additional SPA fallback for production - ensure ALL non-API routes serve index.html
      app.get("*", (req, res) => {
        // Don't serve index.html for API routes
        if (req.path.startsWith("/api/")) {
          return res.status(404).json({ message: "API endpoint not found" });
        }
        
        // Serve index.html for all other routes (let React Router handle client-side routing)
        const distPath = path.resolve(import.meta.dirname, "public");
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } catch (error) {
      log("Production build not found, falling back to development mode");
      console.warn("Build directory missing, using development mode in production");
      await setupVite(app, server);
    }
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Server started on port ${port}`);
  });
})();
