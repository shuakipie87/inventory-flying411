import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Prisma errors - never expose database internals
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    // P2002 = unique constraint, P2025 = record not found
    if (prismaErr.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'A record with this value already exists',
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Record not found',
      });
    }
    return res.status(400).json({
      status: 'error',
      message: 'Database operation failed',
    });
  }

  if (err.name === 'PrismaClientUnknownRequestError') {
    return res.status(500).json({
      status: 'error',
      message: 'Database error',
    });
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid data provided',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  // Default error - never expose internals in production
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};
