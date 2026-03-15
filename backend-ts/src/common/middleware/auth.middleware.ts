import { Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import config from  '../../config';
import { UnauthorizedError } from '../exceptions'; 
import { IAuthRequest, ITokenPayload } from '../types/types';


// Generate Access Token (short-lived: 1 hour)
export const generateAccessToken = (userId: string, role?: string): string => {
    return jwt.sign({userId, role}, config.jwtSecret, { expiresIn: config.jwtAccessExpire })
}

// Generate Refresh Token (long-lived: 7 days)
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpire,
  });
};

// Verify Access Token
export const verifyAccessToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as ITokenPayload;
  } catch (error) {
    return null;
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as ITokenPayload;
  } catch (error) {
    return null;
  }
};

// Middleware: Protect routes (require authentication)
export const protect = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Not authorized to access this route. No token provided.');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new UnauthorizedError('Token is invalid or expired');
    }

    // Note: User verification will be done in individual modules
    // Attach decoded info to request
    req.user = decoded as any;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware: Restrict to specific roles
export const restrictTo = (...roles: string[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new UnauthorizedError('You do not have permission to perform this action')
      );
    }
    next();
  };
};

// Aliases for consistency
export const authenticate = protect;
export const authorize = restrictTo;
