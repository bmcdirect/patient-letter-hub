import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "./types"; // Import session type definitions

const app = express();
const server = createServer(app);

// Configure session middleware FIRST
app.use(session({
  secret: process.env.SESSION_SECRET || 'patientletterhub-secret-key-2025',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'sessionId'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Populate req.user from session
app.use((req, res, next) => {
  if (req.session?.user) {
    req.user = req.session.user;
    // Ensure userId is also available
    if (!req.session.userId && req.session.user.id) {
      req.session.userId = req.session.user.id;
    }
  } else {
    req.user = null;
  }
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
  try {
    console.log("Starting server initialization...");
    
    // Serve static files FIRST before any other middleware
    console.log("Setting up static file serving...");
    const staticOptions = { 
      maxAge: 0,
      etag: false,
      lastModified: false,
      setHeaders: (res: any) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    };
    
    // Serve from both root public and server/public to ensure compatibility
    app.use(express.static('public', staticOptions));
    app.use(express.static(path.resolve('server/public'), staticOptions));
    
    // Setup multer for file uploads
    const upload = multer({ 
      dest: 'uploads/',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Maximum 10 files
      }
    });
    
    // Add multer middleware to routes that need file upload
    app.use('/api/orders', upload.any());
    
    registerRoutes(app);
    console.log("Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error:", err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("Setting up Vite in development mode...");
      await setupVite(app, server);
      console.log("Vite setup complete");
    } else {
      console.log("Serving static files in production mode...");
      serveStatic(app);
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
      log(`serving on port ${port}`);
      console.log(`✅ PatientLetterHub server is ready at http://0.0.0.0:${port}`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
