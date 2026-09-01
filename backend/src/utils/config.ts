import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars if present
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/codesentry',
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
  repoStoragePath: process.env.REPO_STORAGE_PATH || path.resolve('./data/repos'),
};
