import { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions';
import { logger } from '../logger';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    logger.error(`Error processing ${req.method} ${req.url}:`, err);

    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError && err.isOperational) {
        statusCode = err.statusCode;
        message = err.message;
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
};