import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';

// Ensure upload directory exists
const uploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Save with unique name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();
  
  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
