import { IOcrProvider, IOcrResult } from './ocr.provider.interface';
import { logger } from '../../utils/logger';
import { ParserUtils } from '../../utils/parser.utils';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export class TesseractProvider implements IOcrProvider {
  public async extractData(
    filePath: string,
    mimeType: string,
    documentType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC'
  ): Promise<IOcrResult> {
    logger.info(`Running Tesseract OCR Provider for: ${filePath}, type: ${documentType}`);
    const isPdf = mimeType.toLowerCase() === 'application/pdf';
    let rawText = '';

    if (isPdf) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(fileBuffer);
        rawText = pdfData.text;
        logger.info(`Extracted searchable text from PDF, length: ${rawText.length}`);
      } catch (err: any) {
        logger.error(`Failed to parse PDF text locally: ${err.message}`);
        throw new Error(`Failed to parse PDF: ${err.message}`);
      }
    } else {
      let worker;
      try {
        worker = await createWorker('eng', 1, { cachePath: '/tmp' });
        const ret = await worker.recognize(filePath);
        rawText = ret.data.text;
        logger.info(`Extracted text via Tesseract.js, character count: ${rawText.length}`);
      } catch (err: any) {
        logger.error(`Tesseract OCR process failed: ${err.message}`);
        throw new Error(`OCR Processing Failed: ${err.message}`);
      } finally {
        if (worker) {
          await worker.terminate();
        }
      }
    }

    let data: Record<string, string> = {};

    switch (documentType) {
      case 'AADHAAR': {
        const parsed = ParserUtils.parseAadhaar(rawText);
        data = parsed.data as Record<string, string>;
        break;
      }
      case 'PAN': {
        const parsed = ParserUtils.parsePan(rawText);
        data = parsed.data as Record<string, string>;
        break;
      }
      case 'DRIVING_LICENSE': {
        const parsed = ParserUtils.parseDrivingLicense(rawText);
        data = parsed.data as Record<string, string>;
        break;
      }
      case 'VEHICLE_RC': {
        const parsed = ParserUtils.parseVehicleRC(rawText);
        data = parsed.data as Record<string, string>;
        break;
      }
      default:
        data = {};
    }

    return {
      data,
      rawText
    };
  }
}
