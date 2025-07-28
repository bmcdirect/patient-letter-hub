import multer from 'multer';

// Configure multer with no restrictions to accept all fields
const multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 12
  }
});

export const upload = multerConfig.any();