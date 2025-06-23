import express, { type Express } from 'express';
import { db } from './db';
import { storage } from './storage';
import { requireAuth } from './middleware/auth';

const router = express.Router();

// === AUTH ===
router.get('/api/auth/user', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No user ID in session' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/api/auth/logout', requireAuth, async (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// === PRACTICE LOCATION DROPDOWN FOR QUOTES ===
router.get('/api/settings/practice/locations', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No user ID in session' });
    }

    // For now, return a simple response - this can be enhanced later with actual practice/location data
    res.json({ success: true, locations: [] });
  } catch (error) {
    console.error('Error getting practice locations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === QUOTE CREATION ===
router.post('/api/quotes', requireAuth, async (req, res) => {
  try {
    const {
      location_id,
      subject,
      templateType,
      colorMode,
      estimatedRecipients,
      enclosures,
      notes
    } = req.body;

    if (!subject || !templateType || !colorMode || !estimatedRecipients) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No user ID in session' });
    }

    // For now, create a simple quote response - this can be enhanced later with actual quote creation
    const quoteNumber = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    
    res.json({ 
      success: true, 
      quoteId: Date.now(), 
      quoteNumber: quoteNumber 
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Export a function to register routes
export function registerRoutes(app: Express) {
  app.use(router);
}

