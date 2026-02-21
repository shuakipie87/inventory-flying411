import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to catch errors and pass them to next().
 * Eliminates the need for try/catch blocks in every controller.
 */
export const asyncHandler = (
  fn: (req: any, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
