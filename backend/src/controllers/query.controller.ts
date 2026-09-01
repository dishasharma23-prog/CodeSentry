import { Request, Response, NextFunction } from 'express';
import { ragServiceClient } from '../services/ragService.client';
import { QueryHistory } from '../models/QueryHistory';
import { repositoryService } from '../services/repository.service';
import logger from '../utils/logger';

export const queryRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { query, top_k } = req.body;

    // Ensure repo exists
    await repositoryService.findById(id);

    logger.info(`Querying repository ${id}: ${query}`);
    
    // Call RAG service
    const response = await ragServiceClient.query(id, query, top_k);
    
    // Save to history
    const history = new QueryHistory({
      repositoryId: id,
      query: query,
      answer: response.answer,
      sources: response.sources || [],
    });
    
    await history.save();

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};
