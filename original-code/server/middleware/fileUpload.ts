import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = /jpeg|jpg|png/;
  const allowedDocTypes = /csv|pdf/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'logo' || file.fieldname === 'signature') {
    if (allowedImageTypes.test(extname.substring(1))) {
      return cb(null, true);
    }
  } else if (file.fieldname === 'recipients' || file.fieldname === 'file') {
    if (allowedDocTypes.test(extname.substring(1))) {
      return cb(null, true);
    }
  }
  
  cb(new Error('Invalid file type'));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter
});
