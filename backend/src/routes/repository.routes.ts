import { Router } from 'express';
import {
  createRepository,
  listRepositories,
  getRepository,
  getRepositoryStatus,
  indexRepository,
  getRepositoryFiles,
  getFileContent,
} from '../controllers/repository.controller';
import { validate } from '../middleware/validation';
import { createRepositorySchema, idParamSchema, idAndFileParamSchema } from '../validators/repository.validator';

const router = Router();

router.post('/', validate(createRepositorySchema, 'body'), createRepository);
router.get('/', listRepositories);
router.get('/:id', validate(idParamSchema, 'params'), getRepository);
router.get('/:id/status', validate(idParamSchema, 'params'), getRepositoryStatus);
router.post('/:id/index', validate(idParamSchema, 'params'), indexRepository);
router.get('/:id/files', validate(idParamSchema, 'params'), getRepositoryFiles);
router.get('/:id/files/*', validate(idAndFileParamSchema, 'params'), getFileContent);

export default router;
