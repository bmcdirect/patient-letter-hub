import { Request, Response } from 'express';
import { loginUser, getAllPractices } from '../auth';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    (req as any).log.info({
      email,
      hasPassword: !!password,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
      nodeEnv: process.env.NODE_ENV,
      replitEnv: process.env.REPLIT_ENVIRONMENT
    }, 'Login attempt');
    
    if (!email || !password) {
      (req as any).log.warn({ email, hasPassword: !!password }, 'Login attempt missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userData = await loginUser(email, password);
    
    // Regenerate session to ensure it's saved with new data
    req.session.regenerate((err) => {
      if (err) {
        (req as any).log.error({ error: err, email }, 'Session regenerate error');
        return res.status(500).json({ error: 'Session regenerate failed' });
      }
      
      // Store user data in session
      req.session.userId = userData.id;
      req.session.userData = userData;
      
      (req as any).log.info({
        email,
        userId: userData.id,
        tenantId: userData.tenantId,
        practiceName: userData.practiceName,
        role: userData.role,
        sessionId: req.session.id
      }, 'Login successful');
      
      // Explicitly save the session to ensure cookie is set
      req.session.save((saveErr) => {
        if (saveErr) {
          (req as any).log.error({ error: saveErr, email, userId: userData.id }, 'Session save error');
          return res.status(500).json({ error: 'Session save failed' });
        }
        
        res.json({
          message: 'Login successful',
          user: userData
        });
      });
    });
  } catch (error) {
    (req as any).log.error({ error, email }, 'Login error');
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

export async function currentUser(req: Request, res: Response) {
  const userId = req.session?.userId;
  const tenantId = req.session?.userData?.tenantId;
  
  (req as any).log.info({
    userId,
    tenantId,
    hasSession: !!req.session,
    hasUserData: !!req.session?.userData,
    sessionId: req.session?.id,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin
  }, 'Current user check');
  
  if (!userId) {
    (req as any).log.warn({ sessionId: req.session?.id }, 'Authentication check failed - no user ID');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  (req as any).log.info({ userId, tenantId }, 'Current user retrieved successfully');
  
  res.json(req.session.userData);
}

export async function logout(req: Request, res: Response) {
  const userId = req.session?.userId;
  const tenantId = req.session?.userData?.tenantId;
  
  (req as any).log.info({ userId, tenantId }, 'Logout initiated');
  
  req.session.destroy((err) => {
    if (err) {
      (req as any).log.error({ error: err, userId, tenantId }, 'Logout error');
      return res.status(500).json({ error: 'Failed to logout' });
    }
    
    (req as any).log.info({ userId, tenantId }, 'Logout successful');
    res.json({ message: 'Logged out successfully' });
  });
}

export async function practices(req: Request, res: Response) {
  try {
    (req as any).log.info('Fetching all practices');
    
    const allPractices = await getAllPractices();
    
    (req as any).log.info({ practiceCount: allPractices.length }, 'Practices retrieved successfully');
    
    res.json(allPractices);
  } catch (error) {
    (req as any).log.error({ error }, 'Error fetching practices');
    res.status(500).json({ error: 'Failed to fetch practices' });
  }
}