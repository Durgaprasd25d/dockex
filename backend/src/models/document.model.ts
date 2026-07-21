import { Schema, model, Document } from 'mongoose';

export interface IDocument {
  documentType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  data: Record<string, string>;
  rawText: string;
  files: {
    filename: string;
    originalname: string;
    path: string;
    mimeType: string;
    size: number;
  }[];
  uploadedAt: Date;
}

export interface IDocumentDocument extends IDocument, Document {}

const DocumentSchema = new Schema<IDocumentDocument>({
  documentType: {
    type: String,
    enum: ['AADHAAR', 'PAN', 'DRIVING_LICENSE', 'VEHICLE_RC'],
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    required: true,
    default: 'PENDING',
  },
  data: { type: Schema.Types.Mixed, default: {} },
  rawText: { type: String, default: '' },
  files: [{
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  }],
  uploadedAt: { type: Date, default: Date.now },
});

export const DocumentModel = model<IDocumentDocument>('Document', DocumentSchema);
