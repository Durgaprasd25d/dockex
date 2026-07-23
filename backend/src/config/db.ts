import mongoose from 'mongoose';
import { config } from './config';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

let isConnected = false;

export const dbMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (isConnected) {
    return next();
  }
  
  try {
    if (mongoose.connection.readyState >= 1) {
      isConnected = true;
      return next();
    }
    
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    isConnected = true;
    logger.info('MongoDB Connected.');
    next();
  } catch (error: any) {
    logger.error(`Database connection error: ${error.message}`);
    res.status(500).json({
      status: 'FAILED',
      message: 'Database connection failed. Please ensure MONGODB_URI is correctly configured on your Vercel Environment Variables.',
    });
  }
};
