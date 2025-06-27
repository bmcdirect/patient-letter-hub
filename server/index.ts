import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import { setupVite, serveStatic, log } from './vite';

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Simple API routes for React app functionality
app.get('/api/auth/user', (req, res) => {
  // Mock authentication for now - return authenticated user
  res.json({
    success: true,
    user: {
      id: 1,
      email: 'demo@patientletterhub.com',
      firstName: 'Demo',
      lastName: 'User',
      isAdmin: false
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      email: req.body.email || 'demo@patientletterhub.com',
      firstName: 'Demo',
      lastName: 'User'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/practices', (req, res) => {
  res.json({
    success: true,
    practices: []
  });
});

app.get('/api/templates', (req, res) => {
  res.json({
    success: true,
    templates: []
  });
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    orders: []
  });
});

app.post('/api/orders', (req, res) => {
  res.json({
    success: true,
    orderId: 'demo-order-123'
  });
});

app.get('/api/quotes', (req, res) => {
  res.json({
    success: true,
    quotes: []
  });
});

app.post('/api/quotes', (req, res) => {
  res.json({
    success: true,
    quoteId: 'demo-quote-456'
  });
});

const PORT = parseInt(process.env.PORT || '5000');

async function startServer() {
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