import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

/**
 * Standardized error handling utility
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Send standardized error response
 */
export const sendErrorResponse = (res: Response, error: AppError | Error) => {
  // Operational errors (expected errors)
  if (error instanceof AppError && error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  // Programming errors (unexpected errors)
  console.error('Unexpected error:', error);
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  } as ApiResponse<null>);
};

/**
 * Catch async errors and pass them to error handler
 */
export const catchAsync = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};