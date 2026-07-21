import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { upload } from '../middleware/upload.middleware';
import { uploadRateLimiter, apiRateLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

// Route for uploading documents (images/PDFs) - supports multi-file upload for front/back pages
router.post('/upload', uploadRateLimiter, upload.array('documents', 2), DocumentController.upload);

// Retrieve all extraction history
router.get('/history', apiRateLimiter, DocumentController.getHistory);

// Retrieve individual document extraction detail
router.get('/:id', apiRateLimiter, DocumentController.getById);

// Update extracted fields (for manual user correction)
router.patch('/:id', apiRateLimiter, DocumentController.updateFields);

// Delete extracted record and stored physical file
router.delete('/:id', apiRateLimiter, DocumentController.deleteDoc);

// Download JSON payload file of the extraction
router.get('/:id/download', apiRateLimiter, DocumentController.download);

export default router;
