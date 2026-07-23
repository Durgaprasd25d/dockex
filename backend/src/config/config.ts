import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dock-ex',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  ocrProvider: (process.env.OCR_PROVIDER || 'tesseract').toLowerCase(),
  uploadDir: process.env.VERCEL === '1' ? '/tmp/uploads' : (process.env.UPLOAD_DIR || 'uploads'),
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Validate OCR Provider
const validProviders = ['gemini', 'tesseract', 'mock'];
if (!validProviders.includes(config.ocrProvider)) {
  console.warn(`Warning: Invalid OCR_PROVIDER "${config.ocrProvider}". Defaulting to "tesseract".`);
  config.ocrProvider = 'tesseract';
}
