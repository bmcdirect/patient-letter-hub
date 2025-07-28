import { Router } from 'express';
import { requireAuth } from '../auth';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import * as auth from './auth';
import * as practices from './practices';
import * as quotes from './quotes';
import * as orders from './orders';
import * as orderFiles from './orderFiles';

const router = Router();

// Health check endpoint (no auth required)
router.get('/api/health', (req, res) => {
  (req as any).log.info({ path: req.path }, 'Health check');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no auth required)
router.post('/api/auth/login', auth.login);
router.get('/api/auth/practices', auth.practices);

// Protected routes (auth required)
router.get('/api/auth/user', requireAuth, auth.currentUser);
router.post('/api/auth/logout', requireAuth, auth.logout);

// Simple API endpoints that use tenant context from session
router.get('/api/dashboard/stats', requireAuth, tenantMiddleware, (req, res) => {
  // Set tenant ID in params for the handler
  req.params.tenantId = req.tenantId.toString();
  // Call the dashboard stats handler directly
  quotes.getStats(req, res);
});

router.get('/api/quotes', requireAuth, tenantMiddleware, (req, res) => {
  // Set tenant ID in params for the handler
  req.params.tenantId = req.tenantId.toString();
  quotes.list(req, res);
});

router.get('/api/orders', requireAuth, tenantMiddleware, (req, res) => {
  // Set tenant ID in params for the handler
  req.params.tenantId = req.tenantId.toString();
  orders.list(req, res);
});

router.post('/api/orders', requireAuth, tenantMiddleware, orders.upload.array('files'), (req, res) => {
  // Set tenant ID in params for the handler
  req.params.tenantId = req.tenantId.toString();
  orders.create(req, res);
});

// Practice locations endpoints
router.get('/api/practices/:practiceId/locations', requireAuth, tenantMiddleware, async (req, res) => {
  try {
    const practiceId = Number(req.params.practiceId);
    const tenantId = req.tenantId;
    const userId = (req as any).session?.userId;
    
    (req as any).log.info({ practiceId, tenantId, userId }, 'Getting practice locations');
    
    const locations = await practices.getLocations(practiceId, tenantId);
    
    (req as any).log.info({ practiceId, tenantId, userId, locationCount: locations.length }, 'Locations retrieved successfully');
    
    res.json(locations);
  } catch (error) {
    (req as any).log.error({ error, practiceId: Number(req.params.practiceId), tenantId: req.tenantId, userId: (req as any).session?.userId }, 'Get locations error');
    res.status(500).json({ message: 'Failed to get locations' });
  }
});

router.post('/api/practices/:practiceId/locations', requireAuth, tenantMiddleware, async (req, res) => {
  try {
    const practiceId = Number(req.params.practiceId);
    const tenantId = req.tenantId;
    const userId = (req as any).session?.userId;
    const locationName = req.body.name;
    
    (req as any).log.info({ practiceId, tenantId, userId, locationName }, 'Creating practice location');
    
    const location = await practices.createLocation(practiceId, tenantId, req.body);
    
    (req as any).log.info({ practiceId, tenantId, userId, locationName, locationId: location.id }, 'Location created successfully');
    
    res.status(201).json(location);
  } catch (error) {
    (req as any).log.error({ error, practiceId: Number(req.params.practiceId), tenantId: req.tenantId, userId: (req as any).session?.userId, locationName: req.body.name }, 'Create location error');
    res.status(500).json({ message: 'Failed to create location' });
  }
});

// Tenant-specific routes (auth + tenant context required)
router.use('/api/tenants', requireAuth, tenantMiddleware);

// Practices routes
router.get('/api/tenants/:tenantId/practices', practices.list);
router.post('/api/tenants/:tenantId/practices', practices.create);

// Quotes routes
router.get('/api/tenants/:tenantId/quotes', quotes.list);
router.post('/api/tenants/:tenantId/quotes', quotes.create);
router.put('/api/tenants/:tenantId/quotes/:id', quotes.update);
router.delete('/api/tenants/:tenantId/quotes/:id', quotes.remove);

// Orders routes  
router.get('/api/tenants/:tenantId/orders', orders.list);
router.post('/api/tenants/:tenantId/orders', orders.upload.array('files'), orders.create);
router.put('/api/tenants/:tenantId/orders/:id', orders.update);
router.delete('/api/tenants/:tenantId/orders/:id', orders.remove);

// Order files routes
router.get('/api/orders/:orderId/files', requireAuth, orderFiles.list);

export default router;