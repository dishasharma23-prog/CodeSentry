import { Request, Response, NextFunction } from 'express';
import { ragServiceClient } from '../services/ragService.client';
import { Finding } from '../models/Finding';
import { repositoryService } from '../services/repository.service';
import logger from '../utils/logger';

export const runSecurityAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // Ensure repo exists
    const repo = await repositoryService.findById(id);

    logger.info(`Running security analysis for repository ${id}`);
    
    // Call RAG service
    const response = await ragServiceClient.securityAnalysis(id);
    
    const findings = response.findings || [];
    
    // Delete existing findings for this repo
    await Finding.deleteMany({ repositoryId: id });
    
    // Save new findings
    const findingsToSave = findings.map((f: any) => ({
      repositoryId: id,
      severity: f.severity,
      title: f.title,
      description: f.description,
      category: f.category || 'general',
      filePath: f.file_path || f.filePath || 'Unknown',
      functionName: f.function_name || f.functionName,
      className: f.class_name || f.className,
      startLine: f.start_line || f.startLine || 1,
      endLine: f.end_line || f.endLine || 1,
      evidence: f.evidence || 'Not provided',
      sourceCode: f.source_code || f.sourceCode || 'Not provided',
      confidence: f.confidence || 'medium',
      recommendation: f.recommendation || 'Not provided'
    }));
    
    if (findingsToSave.length > 0) {
      await Finding.insertMany(findingsToSave);
    }
    
    // Update repo stats
    repo.stats.totalFindings = findingsToSave.length;
    await repo.save();

    res.json({
      success: true,
      message: `Security analysis completed. Found ${findingsToSave.length} issues.`,
      data: findingsToSave,
    });
  } catch (error) {
    next(error);
  }
};

export const getFindings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    
    // Ensure repo exists
    await repositoryService.findById(id);
    
    const findings = await Finding.find({ repositoryId: id }).sort({ severity: 1 }); // customize sort as needed

    res.json({
      success: true,
      data: findings,
    });
  } catch (error) {
    next(error);
  }
};
