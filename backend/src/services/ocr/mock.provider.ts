import { IOcrProvider, IOcrResult } from './ocr.provider.interface';
import { logger } from '../../utils/logger';

export class MockProvider implements IOcrProvider {
  public async extractData(
    filePath: string,
    mimeType: string,
    documentType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC'
  ): Promise<IOcrResult> {
    logger.info(`Running Mock OCR Provider for document type: ${documentType}`);
    
    // Simulate slight local processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    switch (documentType) {
      case 'PAN':
        return {
          data: {
            name: 'DURGAPRASAD KURAGAYALA',
            fatherName: 'SRINIVASA RAO KURAGAYALA',
            dob: '15-08-1995',
            panNumber: 'APKPK1234F',
          },
          rawText: 'INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nPERMANENT ACCOUNT CARD\nAPKPK1234F\nNAME: DURGAPRASAD KURAGAYALA\nFATHER\'S NAME: SRINIVASA RAO KURAGAYALA\nDOB: 15-08-1995\nSignature'
        };
      case 'DRIVING_LICENSE':
        return {
          data: {
            name: 'Durgaprasad Kuragayala',
            dob: '15-08-1995',
            licenseNumber: 'AP39 20150029384',
            expiryDate: '14-08-2035',
            address: 'Door No 4-56, Main Road, Vijayawada, Andhra Pradesh',
            pincode: '520001'
          },
          rawText: 'UNION OF INDIA DRIVING LICENCE\nANDHRA PRADESH ROAD TRANSPORT\nLICENCE NO: AP39 20150029384\nNAME: Durgaprasad Kuragayala\nDOB: 15-08-1995\nADDRESS: Door No 4-56, Main Road, Vijayawada, Andhra Pradesh, 520001\nVALID UPTO: 14-08-2035'
        };
      case 'VEHICLE_RC':
        return {
          data: {
            registrationNumber: 'AP39TV1234',
            ownerName: 'DURGAPRASAD KURAGAYALA',
            chassisNumber: 'ME4BR1234567890AA',
            engineNumber: 'E3B41234567',
            vehicleModel: 'HONDA ACTIVA 6G',
            expiryDate: '10-10-2036'
          },
          rawText: 'UNION OF INDIA VEHICLE REGISTRATION CERTIFICATE\nREGISTRATION NO: AP39TV1234\nOWNER NAME: DURGAPRASAD KURAGAYALA\nCHASSIS NO: ME4BR1234567890AA\nENGINE NO: E3B41234567\nMODEL: HONDA ACTIVA 6G\nREGISTRATION DATE: 11-10-2021\nVALID UPTO: 10-10-2036'
        };
      case 'AADHAAR':
      default:
        return {
          data: {
            name: 'Durgaprasad Kuragayala',
            dob: '15-08-1995',
            gender: 'MALE',
            aadhaarNumber: '1234 5678 9012',
            address: 'S/O Srinivasa Rao, Door No 4-56, Main Road, Vijayawada, Andhra Pradesh',
            pincode: '520001'
          },
          rawText: 'GOVERNMENT OF INDIA\nUnique Identification Authority of India\nTo\nDurgaprasad Kuragayala\nDOB: 15/08/1995\nGENDER: MALE\n1234 5678 9012\nAddress:\nS/O Srinivasa Rao, Door No 4-56, Main Road, Vijayawada, Andhra Pradesh, 520001'
        };
    }
  }
}
