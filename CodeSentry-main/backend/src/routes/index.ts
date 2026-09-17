import { Router } from 'express';
import repositoryRoutes from './repository.routes';
import queryRoutes from './query.routes';
import findingsRoutes from './findings.routes';

const router = Router();

router.use('/', repositoryRoutes);
router.use('/:id/query', queryRoutes);
router.use('/:id', findingsRoutes);

export default router;
