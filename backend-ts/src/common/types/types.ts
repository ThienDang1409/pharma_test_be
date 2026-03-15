import { Request } from 'express';

// Auth Request Interface
export interface IAuthRequest extends Request {
  user?: any; // Will be populated by protect middleware
}

// Token Payload Interface
export interface ITokenPayload {
  userId: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// API Response Interface
export interface IApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination Interface
export interface IPaginationQuery {
  page?: string;
  limit?: string;
}

export interface IPaginationResult<T> {
  items: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}
