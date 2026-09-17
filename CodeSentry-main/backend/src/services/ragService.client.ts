import axios, { AxiosInstance } from 'axios';
import { config } from '../utils/config';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

class RagServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.pythonServiceUrl,
    });
  }

  async health(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('RAG Service health check failed', { error });
      return false;
    }
  }

  async indexRepository(repositoryId: string, repoPath: string): Promise<any> {
    try {
      logger.info(`Sending index request for ${repositoryId} to RAG service`);
      const response = await this.client.post('/index', {
        repository_id: repositoryId,
        repo_path: repoPath,
      }, {
        timeout: 5 * 60 * 1000, // 5 minutes
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to index repository ${repositoryId}`, { error: error.message });
      throw new AppError(`Failed to index repository: ${error.message}`, 500);
    }
  }

  async query(repositoryId: string, query: string, topK: number = 5): Promise<any> {
    try {
      const response = await this.client.post('/query', {
        repository_id: repositoryId,
        query,
        top_k: topK,
      }, {
        timeout: 5 * 60 * 1000, // 5 minutes
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Query failed for repository ${repositoryId}`, { error: error.message });
      throw new AppError(`Query failed: ${error.message}`, 500);
    }
  }

  async securityAnalysis(repositoryId: string): Promise<any> {
    try {
      const response = await this.client.post('/security-analysis', {
        repository_id: repositoryId,
      }, {
        timeout: 5 * 60 * 1000, // 5 minutes
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Security analysis failed for repository ${repositoryId}`, { error: error.message });
      throw new AppError(`Security analysis failed: ${error.message}`, 500);
    }
  }

  async deleteRepository(repositoryId: string): Promise<any> {
    try {
      const response = await this.client.post('/delete', {
        repository_id: repositoryId,
      }, {
        timeout: 30 * 1000, // 30 seconds
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Delete failed for repository ${repositoryId}`, { error: error.message });
      // We don't throw here to allow cleanup to continue even if RAG is down
      return { status: 'error', message: error.message };
    }
  }
}

export const ragServiceClient = new RagServiceClient();
