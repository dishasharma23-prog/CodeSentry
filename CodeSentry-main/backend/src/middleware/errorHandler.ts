import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error') {
    super(message, 400);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`[AppError] ${err.message}`, { stack: err.stack, statusCode: err.statusCode });
    res.status(err.statusCode).json({
      error: true,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  logger.error(`[UnhandledError] ${err.message}`, { stack: err.stack });
  
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    statusCode: 500,
  });
};
