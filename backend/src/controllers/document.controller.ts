import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { logger } from '../utils/logger';

export class DocumentController {
  /**
   * Upload and process documents.
   */
  public static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const { documentType } = req.body;
      
      if (!documentType) {
        res.status(400).json({ status: 'FAILED', message: 'Document type is required.' });
        return;
      }

      if (!files || files.length === 0) {
        res.status(400).json({ status: 'FAILED', message: 'No documents uploaded.' });
        return;
      }

      logger.info(`API: Upload request received for type: ${documentType} with ${files.length} file(s).`);
      const result = await DocumentService.processDocuments(files, documentType);

      res.status(201).json({
        status: 'SUCCESS',
        message: 'Documents processed successfully.',
        data: result,
      });
    } catch (error: any) {
      logger.error(`API upload controller error: ${error.message}`);
      next(error);
    }
  }

  /**
   * Get all extraction logs.
   */
  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('API: Fetching document history.');
      const result = await DocumentService.getHistory();
      res.status(200).json({
        status: 'SUCCESS',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get single extraction details.
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`API: Fetching document by ID: ${id}`);
      const result = await DocumentService.getDocumentById(id);

      if (!result) {
        res.status(404).json({ status: 'FAILED', message: 'Document not found.' });
        return;
      }

      res.status(200).json({
        status: 'SUCCESS',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Save user edited fields.
   */
  public static async updateFields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { fields } = req.body;
      
      if (!fields) {
        res.status(400).json({ status: 'FAILED', message: 'Missing fields to update.' });
        return;
      }

      logger.info(`API: Updating fields for document ID: ${id}`);
      const result = await DocumentService.updateDocumentFields(id, fields);

      res.status(200).json({
        status: 'SUCCESS',
        message: 'Document fields updated successfully.',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Delete document.
   */
  public static async deleteDoc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`API: Deleting document ID: ${id}`);
      await DocumentService.deleteDocument(id);

      res.status(200).json({
        status: 'SUCCESS',
        message: 'Document deleted successfully.',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Download extracted JSON payload.
   */
  public static async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`API: Requesting download for document ID: ${id}`);
      const result = await DocumentService.getDocumentById(id);

      if (!result) {
        res.status(404).json({ status: 'FAILED', message: 'Document not found.' });
        return;
      }

      const exportData = {
        documentType: result.documentType,
        status: result.status,
        data: result.data,
        rawText: result.rawText,
        metadata: {
          uploadedAt: result.uploadedAt,
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=extracted-${result.documentType}-${id}.json`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error: any) {
      next(error);
    }
  }
}
