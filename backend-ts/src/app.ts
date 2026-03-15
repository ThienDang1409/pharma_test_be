import path from 'path';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './common/middleware';
import setupRoutes from './route';
import { ERROR_MESSAGES, DEFAULTS } from './common/constants';
import { logger } from './common/logger';

const app: Express = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

app.use(express.json({ limit: DEFAULTS.JSON_LIMIT }));
app.use(express.urlencoded({ limit: DEFAULTS.JSON_LIMIT, extended: true }));

// Debug middleware - log all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Simple static serving for a possible frontend (optional)
app.use(express.static(path.join(__dirname, '..', '..')));

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server running', uptime: process.uptime() });
});

// Setup all routes
setupRoutes(app);

// Setup Swagger UI
import { setupSwagger } from './config/swagger';
setupSwagger(app);

// Global 404
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.warn(`404: ${req.method} ${req.path} - No route match`);
  res.status(404).json({
    message: ERROR_MESSAGES.ROUTE_NOT_FOUND,
    path: req.path,
    method: req.method,
  });
});

// Global error handler (centralized)
app.use(errorHandler);

export default app;
