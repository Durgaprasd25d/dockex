import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}`);
  if (err.stack) {
    logger.debug(err.stack);
  }

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    status: 'FAILED',
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
