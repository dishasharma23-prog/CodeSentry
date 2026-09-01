import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './app';
import { config } from './utils/config';
import logger from './utils/logger';

const startServer = async () => {
  try {
    let mongoUri = config.mongoUri;
    let mongod: MongoMemoryServer | null = null;
    
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      if (!process.env.MONGODB_URI) {
        throw new Error('FATAL: MONGODB_URI environment variable is required in production.');
      }
      // In production, we never start MongoMemoryServer. 
      // We explicitly use the configured URI.
      mongoUri = process.env.MONGODB_URI;
    } else {
      // If running locally without a real DB (or fallback), spin up an in-memory instance
      if (!process.env.MONGODB_URI || mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        logger.info('Using local dev mode, starting fresh in-memory MongoDB Server...');
        mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
      }
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    logger.info(`Connected to MongoDB at ${mongoUri}`);

    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Received shutdown signal, shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
      });
      await mongoose.disconnect();
      if (mongod) {
        await mongod.stop();
      }
      logger.info('MongoDB disconnected');
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
