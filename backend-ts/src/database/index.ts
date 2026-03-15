import mongoose from "mongoose";
import config from '../config';
import { logger } from '../common/logger';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Handle events after initial connection
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination (SIGINT)');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination (SIGTERM)');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error("❌ MongoDB connection failed on initial startup", error);
    process.exit(1);
  }
};
