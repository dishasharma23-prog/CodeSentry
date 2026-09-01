import path from 'path';
import fs from 'fs/promises';
import { Repository, IRepository } from '../models/Repository';
import { gitService } from './git.service';
import { ragServiceClient } from './ragService.client';
import { config } from '../utils/config';
import logger from '../utils/logger';
import { NotFoundError, AppError } from '../middleware/errorHandler';

export class RepositoryService {
  async create(url: string): Promise<IRepository> {
    const { owner, name } = gitService.getRepositoryInfo(url);
    
    const repository = new Repository({
      url,
      owner,
      name,
      status: 'pending',
    });

    await repository.save();
    
    // Fire and forget
    this.processRepository(repository.id).catch(err => {
      logger.error(`Background processing failed for ${repository.id}`, { error: err.message });
    });

    return repository;
  }

  async findAll(): Promise<IRepository[]> {
    return Repository.find().sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<IRepository> {
    const repo = await Repository.findById(id);
    if (!repo) {
      throw new NotFoundError('Repository not found');
    }
    return repo;
  }

  async getStatus(id: string): Promise<string> {
    const repo = await this.findById(id);
    return repo.status;
  }

  async processRepository(id: string): Promise<void> {
    const repo = await this.findById(id);
    const localPath = path.join(config.repoStoragePath, id);
    
    try {
      // 1. Update status to 'cloning'
      repo.status = 'cloning';
      repo.localPath = localPath;
      await repo.save();

      // 2. Clone repo
      await gitService.cloneRepository(repo.url, localPath);

      // 3. Update status to 'parsing' -> wait, the RAG service handles this, we'll just say indexing
      repo.status = 'indexing';
      await repo.save();

      // 4. Call RAG service /index
      const indexResult = await ragServiceClient.indexRepository(id, localPath);

      // 6. When done, update status to 'ready' with stats
      repo.status = 'ready';
      repo.stats = {
        totalFiles: indexResult.total_files || 0,
        totalChunks: indexResult.total_chunks || 0,
        totalFindings: 0,
        languages: indexResult.languages || {},
      };
      await repo.save();
      
      logger.info(`Successfully processed repository ${id}`);
    } catch (error: any) {
      repo.status = 'failed';
      repo.error = error.message;
      await repo.save();
      logger.error(`Failed to process repository ${id}`, { error: error.message });
    }
  }

  async getFiles(id: string, subpath: string = ''): Promise<any[]> {
    const repo = await this.findById(id);
    if (!repo.localPath) {
      throw new AppError('Repository not cloned yet', 400);
    }

    // Decode URL-encoded paths and normalize separators
    const decodedSubpath = decodeURIComponent(subpath);
    const normalizedSubpath = decodedSubpath.replace(/[\\/]+/g, path.sep);
    
    // Use canonical storage path, avoiding relative DB path issues
    const repoRoot = path.resolve(config.repoStoragePath, id);
    const targetPath = path.normalize(path.join(repoRoot, normalizedSubpath));
    
    // Prevent directory traversal
    if (!targetPath.startsWith(repoRoot + path.sep) && targetPath !== repoRoot) {
      throw new AppError('Invalid path', 400);
    }

    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        // Skip .git directory
        if (entry.name === '.git') continue;

        const entryPath = path.join(targetPath, entry.name);
        const relativePath = path.relative(repo.localPath, entryPath);
        
        let size = 0;
        if (entry.isFile()) {
          const stat = await fs.stat(entryPath);
          size = stat.size;
        }

        files.push({
          name: entry.name,
          path: relativePath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size,
          language: this.getLanguageFromExtension(entry.name),
        });
      }

      return files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundError('Path not found');
      }
      throw new AppError(`Failed to read directory: ${error.message}`, 500);
    }
  }

  async getFileContent(id: string, filePath: string): Promise<any> {
    const repo = await this.findById(id);
    if (!repo.localPath) {
      throw new AppError('Repository not cloned yet', 400);
    }

    // Decode URL-encoded paths and normalize separators
    const decodedFilePath = decodeURIComponent(filePath);
    const normalizedFilePath = decodedFilePath.replace(/[\\/]+/g, path.sep);
    
    // Use canonical storage path, avoiding relative DB path issues
    const repoRoot = path.resolve(config.repoStoragePath, id);
    const targetPath = path.normalize(path.join(repoRoot, normalizedFilePath));
    
    // Prevent directory traversal
    if (!targetPath.startsWith(repoRoot + path.sep) && targetPath !== repoRoot) {
      throw new AppError('Invalid path', 400);
    }

    try {
      const content = await fs.readFile(targetPath, 'utf-8');
      const lines = content.split('\n');
      
      return {
        content,
        language: this.getLanguageFromExtension(targetPath),
        lineCount: lines.length,
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundError('File not found');
      }
      throw new AppError(`Failed to read file: ${error.message}`, 500);
    }
  }

  private getLanguageFromExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const map: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
    };
    return map[ext] || 'text';
  }
}

export const repositoryService = new RepositoryService();
