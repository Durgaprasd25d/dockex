import { DocumentModel, IDocument } from '../models/document.model';
import { IOcrProvider, IOcrResult } from './ocr/ocr.provider.interface';
import { TesseractProvider } from './ocr/tesseract.provider';
import { MockProvider } from './ocr/mock.provider';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class DocumentService {
  private static getOcrProvider(): IOcrProvider {
    switch (config.ocrProvider) {
      case 'mock':
        return new MockProvider();
      case 'tesseract':
      default:
        return new TesseractProvider();
    }
  }

  /**
   * Processes a list of uploaded files, runs OCR, and saves to MongoDB.
   */
  public static async processDocuments(
    uploadedFiles: Express.Multer.File[],
    documentType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC'
  ): Promise<any> {
    const provider = this.getOcrProvider();

    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new Error('No files provided for processing.');
    }

    logger.info(`Starting document processing for ${uploadedFiles.length} file(s). Selected type: ${documentType}`);

    const results: IOcrResult[] = [];
    const filesMetadata = [];

    for (const file of uploadedFiles) {
      try {
        const ocrResult = await provider.extractData(file.path, file.mimetype, documentType);
        results.push(ocrResult);
      } catch (err: any) {
        logger.error(`OCR processing failed for file ${file.originalname}: ${err.message}`);
        throw err;
      }

      filesMetadata.push({
        filename: file.filename,
        originalname: file.originalname,
        path: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
      });
    }

    let mergedData: Record<string, string> = {};
    results.forEach(r => {
      mergedData = { ...mergedData, ...r.data };
    });

    const consolidatedRaw = results.map((r, i) => `[Page ${i + 1} - ${uploadedFiles[i].originalname}]\n${r.rawText}`).join('\n\n');

    const documentObj: IDocument = {
      documentType,
      status: 'SUCCESS',
      data: mergedData,
      rawText: consolidatedRaw,
      files: filesMetadata,
      uploadedAt: new Date(),
    };

    const savedDoc = await DocumentModel.create(documentObj);
    logger.info(`Stored document in MongoDB. ID: ${savedDoc._id}`);
    
    return savedDoc;
  }

  /**
   * Fetches all documents.
   */
  public static async getHistory(): Promise<any[]> {
    return DocumentModel.find().sort({ uploadedAt: -1 });
  }

  /**
   * Fetches single document.
   */
  public static async getDocumentById(id: string): Promise<any> {
    return DocumentModel.findById(id);
  }

  /**
   * Updates extracted field values.
   */
  public static async updateDocumentFields(id: string, updatedData: Record<string, string>): Promise<any> {
    const doc = await DocumentModel.findById(id);
    if (!doc) {
      throw new Error('Document not found');
    }

    logger.info(`User manual override updates on document ${id}`);
    doc.data = { ...doc.data, ...updatedData };
    doc.markModified('data');
    await doc.save();
    return doc;
  }

  /**
   * Deletes document.
   */
  public static async deleteDocument(id: string): Promise<void> {
    const doc = await DocumentModel.findById(id);
    if (!doc) {
      throw new Error('Document not found');
    }

    doc.files.forEach(file => {
      const localPath = path.resolve(config.uploadDir, file.filename);
      try {
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          logger.info(`Deleted physical file: ${localPath}`);
        }
      } catch (err: any) {
        logger.error(`Failed to delete file ${localPath}: ${err.message}`);
      }
    });

    await DocumentModel.findByIdAndDelete(id);
  }
}
