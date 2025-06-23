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

    // Get practice information and locations
    const practiceQuery = `
      SELECT id, name, contact_prefix, contact_first_name, contact_middle_initial, 
             contact_last_name, contact_suffix, contact_title, phone, email,
             main_address, main_city, main_state, main_zip
      FROM practices_new 
      WHERE user_id = $1
      LIMIT 1
    `;

    const locationsQuery = `
      SELECT id, label, contact_name, contact_title, phone, email,
             address, city, state, zip_code, location_suffix, is_default, active
      FROM practice_locations 
      WHERE practice_id = $1 AND active = true
      ORDER BY is_default DESC, label ASC
    `;

    // Execute practice query first using raw SQL
    const practiceResult = await pool.query(practiceQuery, [userId]);

    if (practiceResult.rows.length === 0) {
      return res.json({ success: true, locations: [] });
    }

    const practice = practiceResult.rows[0];
    const practiceId = practice.id;

    // Get additional locations
    const locationsResult = await pool.query(locationsQuery, [practiceId]);

    const locations = [];

    // Add main practice location as first option
    if (practice.main_address) {
      const contactName = [
        practice.contact_prefix,
        practice.contact_first_name,
        practice.contact_middle_initial,
        practice.contact_last_name,
        practice.contact_suffix
      ].filter(Boolean).join(' ');

      locations.push({
        id: `main-${practiceId}`,
        label: `${practice.name} (Main Location)`,
        location_suffix: `${practiceId}.0`,
        is_default: locationsResult.rows.length === 0 || !locationsResult.rows.some(loc => loc.is_default),
        contact_name: contactName,
        address: `${practice.main_address}, ${practice.main_city}, ${practice.main_state} ${practice.main_zip}`
      });
    }

    // Add additional locations
    locationsResult.rows.forEach(location => {
      locations.push({
        id: location.id,
        label: location.label,
        location_suffix: location.location_suffix,
        is_default: location.is_default,
        contact_name: location.contact_name,
        address: location.address ? `${location.address}, ${location.city}, ${location.state} ${location.zip_code}` : null
      });
    });

    res.json({ success: true, locations });
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

