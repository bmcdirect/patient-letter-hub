import express from 'express';
import { createServer } from 'http';
import { setupVite, serveStatic, log } from './vite.js';

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes for the React app
app.get('/api/auth/user', (req, res) => {
  // Mock user data for now
  res.json({
    success: true,
    user: {
      id: 1,
      email: 'demo@patientletterhub.com',
      firstName: 'Demo',
      lastName: 'User',
      is_admin: false
    }
  });
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

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  serveStatic(app);
} else {
  await setupVite(app, server);
}

server.listen(PORT, '0.0.0.0', () => {
  log(`Server running on port ${PORT}`);
});