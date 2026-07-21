import axios from 'axios';

const API_BASE = '/api/documents';

export interface IFileDetails {
  filename: string;
  originalname: string;
  path: string;
  mimeType: string;
  size: number;
}

export interface IDocument {
  _id: string;
  documentType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  data: Record<string, string>;
  rawText: string;
  files: IFileDetails[];
  uploadedAt: string;
}

export const api = {
  /**
   * Upload multiple files (images/PDF) for processing, with a user-selected document type.
   */
  uploadDocuments: async (
    files: File[],
    documentType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC',
    onUploadProgress?: (progress: number) => void
  ): Promise<IDocument> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    formData.append('documentType', documentType);

    const response = await axios.post<{ status: string; data: IDocument }>(
      `${API_BASE}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onUploadProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percentCompleted);
          }
        },
      }
    );

    return response.data.data;
  },

  /**
   * Get previous extractions history.
   */
  getHistory: async (): Promise<IDocument[]> => {
    const response = await axios.get<{ status: string; data: IDocument[] }>(`${API_BASE}/history`);
    return response.data.data;
  },

  /**
   * Fetch single document by ID.
   */
  getDocumentById: async (id: string): Promise<IDocument> => {
    const response = await axios.get<{ status: string; data: IDocument }>(`${API_BASE}/${id}`);
    return response.data.data;
  },

  /**
   * Updates extracted field values.
   */
  updateFields: async (id: string, fields: Record<string, string>): Promise<IDocument> => {
    const response = await axios.patch<{ status: string; data: IDocument }>(
      `${API_BASE}/${id}`,
      { fields }
    );
    return response.data.data;
  },

  /**
   * Deletes document.
   */
  deleteDocument: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/${id}`);
  },

  /**
   * Get download url.
   */
  getDownloadUrl: (id: string): string => {
    return `${API_BASE}/${id}/download`;
  }
};
