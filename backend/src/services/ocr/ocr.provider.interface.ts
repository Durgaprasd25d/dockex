export interface IOcrResult {
  data: Record<string, string>;
  rawText: string;
}

export interface IOcrProvider {
  extractData(
    filePath: string,
    mimeType: string,
    documentType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC'
  ): Promise<IOcrResult>;
}
