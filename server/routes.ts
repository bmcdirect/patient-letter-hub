import express, { type Express } from 'express';
import { db, pool } from './db';
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

    // For development/testing, use consistent user ID that matches existing practice data
    const userId = email.includes('admin') ? '1' : '2';
    const testUser = {
      id: userId,
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
      
      console.log('Login successful for user:', testUser.email, 'with ID:', testUser.id);
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

    const userId = req.session.user.id;

    // For development, return practice locations based on user ID
    if (userId === '2') {
      // Return the existing practice locations for user 2
      const locations = [
        {
          id: 'main-1',
          label: 'UMass Occupational Therapy (Main Location)',
          location_suffix: '1.0',
          is_default: true,
          contact_name: 'Dr. David Sweeney',
          address: '10 Arch Street, Shrewsbury, MA 01545'
        },
        {
          id: '2',
          label: 'UMass Occupational Therapy',
          location_suffix: '1.2',
          is_default: false,
          contact_name: 'Joe Sweeney',
          address: '10 Arch Street, SHREWSBURY, MA 01545-4801'
        },
        {
          id: '3',
          label: 'North Valley Clinic',
          location_suffix: '1.3',
          is_default: false,
          contact_name: 'Dr. Jane A Smith MD',
          address: '456 North Valley Road, Valley View, CA 90211'
        }
      ];
      
      return res.json({ success: true, locations });
    }

    // For other users, return empty locations
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
      notes,
      dataCleansing,
      ncoaUpdate,
      firstClassPostage
    } = req.body;

    if (!subject || !templateType || !colorMode || !estimatedRecipients) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Calculate total cost including additional services
    const base = colorMode === 'color' ? 0.65 : 0.50;
    let totalCost = estimatedRecipients * (base + (enclosures * 0.10));
    
    if (dataCleansing) totalCost += 25;
    if (ncoaUpdate) totalCost += 50;
    if (firstClassPostage) totalCost += estimatedRecipients * 0.68;

    // Create a simple quote response
    const quoteNumber = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    
    console.log('Quote created:', {
      quoteNumber,
      subject,
      templateType,
      colorMode,
      estimatedRecipients,
      enclosures,
      dataCleansing,
      ncoaUpdate,
      firstClassPostage,
      totalCost: totalCost.toFixed(2)
    });
    
    console.log('Raw request body:', req.body);
    
    res.json({ 
      success: true, 
      quoteId: Date.now(), 
      quoteNumber: quoteNumber,
      totalCost: totalCost.toFixed(2)
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

