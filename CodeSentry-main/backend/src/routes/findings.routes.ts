import { Router } from 'express';
import { runSecurityAnalysis, getFindings } from '../controllers/findings.controller';
import { validate } from '../middleware/validation';
import { idParamSchema } from '../validators/repository.validator';

const router = Router({ mergeParams: true });

router.post('/security-analysis', validate(idParamSchema, 'params'), runSecurityAnalysis);
router.get('/findings', validate(idParamSchema, 'params'), getFindings);

export default router;
