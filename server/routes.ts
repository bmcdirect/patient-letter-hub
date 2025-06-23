import express from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// === AUTH ===
router.get('/api/auth/user', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const user = await db.user.findFirst({
    where: { id: userId },
    select: { id: true, email: true }
  });

  if (!user) return res.status(401).json({ success: false });

  res.json({ success: true, user });
});

router.post('/api/auth/logout', requireAuth, async (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// === PRACTICE LOCATION DROPDOWN FOR QUOTES ===
router.get('/api/settings/practice/locations', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  const user = await db.user.findFirst({
    where: { id: userId },
    include: {
      practiceAssignments: {
        include: {
          practice: {
            include: {
              locations: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.practiceAssignments.length) {
    return res.json({ success: true, locations: [] });
  }

  const assignedPractice = user.practiceAssignments[0].practice;
  const locations = assignedPractice.locations
    .filter(loc => loc.active)
    .map(loc => ({
      id: loc.id,
      label: loc.practice_name || `Location ${loc.id}`,
      location_suffix: loc.location_suffix,
      is_default: loc.is_default
    }));

  res.json({ success: true, locations });
});

// === QUOTE CREATION ===
router.post('/api/quotes', requireAuth, async (req, res) => {
  const {
    location_id,
    subject,
    templateType,
    colorMode,
    estimatedRecipients,
    enclosures,
    notes
  } = req.body;

  if (!location_id || !subject || !templateType || !colorMode || !estimatedRecipients) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const location = await db.practiceLocation.findUnique({ where: { id: parseInt(location_id) } });

  if (!location) {
    return res.status(400).json({ success: false, message: 'Invalid location' });
  }

  const practiceId = location.practice_id;

  const quote = await db.quote.create({
    data: {
      user_id: req.session.userId,
      subject,
      template_type: templateType,
      color_mode: colorMode,
      estimated_recipients: estimatedRecipients,
      enclosures: enclosures || 0,
      notes,
      location_id: location.id,
      practice_id: practiceId,
      quote_number: `Q-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending'
    }
  });

  res.json({ success: true, quoteId: quote.id, quoteNumber: quote.quote_number });
});

export default router;

