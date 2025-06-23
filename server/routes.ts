import express, { type Express } from 'express';
import { db } from './db';
import { storage } from './storage';
import { requireAuth } from './middleware/auth';

const router = express.Router();

// === AUTH ===
router.get('/api/auth/user', async (req, res) => {
  try {
    // Check if user exists in session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = req.session.user;
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email,
        is_admin: user.isAdmin || false
      } 
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST login endpoint for the login form
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // For development/testing, create a test user with the provided email
    const testUser = {
      id: `user-${Date.now()}`,
      email: email,
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      isAdmin: email.includes('admin'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store user in session
    req.session.user = testUser;
    req.session.userId = testUser.id;
    req.user = testUser;

    // Save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session save failed' });
      }
      
      console.log('Login successful for user:', testUser.email);
      res.json({ 
        success: true, 
        user: { 
          id: testUser.id, 
          email: testUser.email, 
          is_admin: testUser.isAdmin 
        } 
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

router.post('/api/auth/logout', async (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// === PRACTICE LOCATION DROPDOWN FOR QUOTES ===
router.get('/api/settings/practice/locations', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Return empty locations array for now - can be enhanced later
    res.json({ success: true, locations: [] });
  } catch (error) {
    console.error('Error getting practice locations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === QUOTE CREATION ===
router.post('/api/quotes', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

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

    // Create a simple quote response
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

