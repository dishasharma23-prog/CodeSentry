import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs/promises';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class GitService {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
    this.git.env('GIT_TERMINAL_PROMPT', '0');
    this.git.env('GCM_INTERACTIVE', 'never');
  }

  getRepositoryInfo(url: string) {
    // Basic validation and parsing for github urls
    // e.g. https://github.com/owner/repo or https://github.com/owner/repo.git
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?/);
    if (!match) {
      throw new AppError('Invalid GitHub URL format', 400);
    }
    
    return {
      owner: match[1],
      name: match[2],
    };
  }

  async cloneRepository(url: string, targetPath: string): Promise<void> {
    try {
      logger.info(`Cloning repository ${url} to ${targetPath}`);
      
      // Ensure target directory exists
      await fs.mkdir(targetPath, { recursive: true });
      
      await this.git.clone(url, targetPath);
      logger.info(`Successfully cloned ${url}`);
    } catch (error: any) {
      logger.error(`Failed to clone repository ${url}`, { error: error.message });
      throw new AppError(`Failed to clone repository: ${error.message}`, 500);
    }
  }
}

export const gitService = new GitService();
