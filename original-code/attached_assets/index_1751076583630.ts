import express from 'express';
import { createServer } from 'http';
import { setupVite, serveStatic, log } from './vite';
import { setupAuth } from './replitAuth';
import { registerRoutes } from './routes';

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function initializeApp() {
  // Setup authentication first
  await setupAuth(app);
  
  // Register all API routes
  registerRoutes(app);
}

const PORT = parseInt(process.env.PORT || '5000');

async function startServer() {
  // Initialize authentication and routes first
  await initializeApp();
  
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  server.listen(PORT, '0.0.0.0', () => {
    log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);