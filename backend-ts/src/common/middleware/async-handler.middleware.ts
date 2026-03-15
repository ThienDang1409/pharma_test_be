import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async route handlers to catch errors
 * Eliminates need for try-catch in every controller
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
