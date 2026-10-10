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
    const maxRetries = 4; // 5 attempts total
    const delays = [5000, 10000, 20000, 40000]; 

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Sending index request for ${repositoryId} to RAG service (Attempt ${attempt + 1}/${maxRetries + 1})`);
        const response = await this.client.post('/index', {
          repository_id: repositoryId,
          repo_path: repoPath,
        }, {
          timeout: 90 * 1000, // 90 seconds to allow cold start
        });
        return response.data;
      } catch (error: any) {
        const isRetriable = !error.response || [429, 502, 503, 504].includes(error.response.status);
        
        if (attempt === maxRetries || !isRetriable) {
          const baseUrl = error.config?.baseURL || 'unknown-base';
          const requestUrl = error.config?.url || '/index';
          
          if (error.response) {
            let safeData = '';
            try {
              if (error.response.data === null || error.response.data === undefined) {
                safeData = String(error.response.data);
              } else if (typeof error.response.data === 'object') {
                safeData = JSON.stringify(error.response.data);
              } else {
                safeData = String(error.response.data);
              }
            } catch (serializationError) {
              safeData = '[Serialization Failed]';
            }
            
            if (safeData.length > 500) {
              safeData = safeData.substring(0, 500) + '... [truncated]';
            }
            
            logger.error(`HTTP error while indexing repository ${repositoryId}`, {
              baseURL: baseUrl,
              url: requestUrl,
              status: error.response.status,
              responseData: safeData,
              message: error.message
            });
          } else if (error.request) {
            logger.error(`Network error while indexing repository ${repositoryId}`, {
              baseURL: baseUrl,
              url: requestUrl,
              code: error.code,
              message: error.message
            });
          } else {
            logger.error(`Failed to setup index request for repository ${repositoryId}`, { error: error.message });
          }
          throw new AppError(`Failed to index repository: ${error.message}`, 500);
        }

        // Backoff and retry
        const delayMs = delays[attempt];
        logger.warn(`RAG service unavailable (status ${error.response?.status || 'network error'}). Retrying in ${delayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
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
