import { Request, Response, NextFunction } from 'express';
import { repositoryService } from '../services/repository.service';

export const createRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    const repository = await repositoryService.create(url);
    res.status(201).json({
      success: true,
      data: repository,
    });
  } catch (error) {
    next(error);
  }
};

export const listRepositories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repositories = await repositoryService.findAll();
    res.json({
      success: true,
      data: repositories,
    });
  } catch (error) {
    next(error);
  }
};

export const getRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const repository = await repositoryService.findById(id);
    res.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    next(error);
  }
};

export const getRepositoryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const status = await repositoryService.getStatus(id);
    res.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    next(error);
  }
};

export const indexRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // Just re-trigger the processing which includes indexing
    repositoryService.processRepository(id).catch(console.error);
    res.json({
      success: true,
      message: 'Indexing started',
    });
  } catch (error) {
    next(error);
  }
};

export const getRepositoryFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const subpath = req.query.path as string || '';
    const files = await repositoryService.getFiles(id, subpath);
    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

export const getFileContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const filePath = req.params[0]; // Capture the wildcard part of the route
    
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'File path is required' });
    }

    const content = await repositoryService.getFileContent(id, filePath);
    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};
