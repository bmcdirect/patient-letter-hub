import { Request, Response, NextFunction } from 'express';
import path from 'path';

// Security middleware for production
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Security headers for all responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS header for production HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize string inputs to prevent XSS
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

// File upload security checks
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  // Check if files are present
  if (!req.files && !req.file) {
    return next();
  }
  
  const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
  const singleFile = req.file as Express.Multer.File | undefined;
  
  const validateSingleFile = (file: Express.Multer.File): boolean => {
    // Check file size (additional check beyond multer)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
    if (file.size > maxSize) {
      return false;
    }
    
    // Check file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.csv', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.svg', '.zip'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return false;
    }
    
    // Check for dangerous file names
    const dangerousPatterns = [
      /\.\./g, // Directory traversal
      /\/\//g, // Double slashes
      /[<>:"\\|?*]/g, // Invalid filename characters
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.originalname)) {
        return false;
      }
    }
    
    return true;
  };
  
  try {
    if (singleFile && !validateSingleFile(singleFile)) {
      return res.status(400).json({ message: 'Invalid file upload' });
    }
    
    if (files) {
      if (Array.isArray(files)) {
        for (const file of files) {
          if (!validateSingleFile(file)) {
            return res.status(400).json({ message: 'Invalid file upload' });
          }
        }
      } else if (typeof files === 'object') {
        for (const fieldName in files) {
          const fieldFiles = files[fieldName];
          for (const file of fieldFiles) {
            if (!validateSingleFile(file)) {
              return res.status(400).json({ message: 'Invalid file upload' });
            }
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('File validation error:', error);
    return res.status(400).json({ message: 'File validation failed' });
  }
};

// Request size limiter
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 50 * 1024 * 1024; // 50MB for requests with files
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  if (contentLength > maxSize) {
    return res.status(413).json({ message: 'Request too large' });
  }
  
  next();
};