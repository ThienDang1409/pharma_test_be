import { Router, Express } from 'express';
import { blogRoute, authRoute, userRoute, informationRoute, imageRoute } from '../modules';
import { API_ROUTES } from '../common/constants';

/**
 * Central route configuration
 * Organizes all API routes in one place for better maintainability
 */
export const setupRoutes = (app: Express): void => {
  // Blog routes
  app.use(API_ROUTES.BLOGS, blogRoute);
  
  // Auth routes
  app.use(API_ROUTES.AUTH, authRoute);
  
  // User routes (admin only)
  app.use(API_ROUTES.USERS, userRoute);
  
  // Information routes
  app.use(API_ROUTES.INFORMATION, informationRoute);
  
  // Image routes
  app.use(API_ROUTES.IMAGES, imageRoute);
};

export default setupRoutes;
