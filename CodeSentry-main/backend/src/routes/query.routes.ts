import { Router } from 'express';
import { queryRepository } from '../controllers/query.controller';
import { validate } from '../middleware/validation';
import { querySchema, idParamSchema } from '../validators/repository.validator';

const router = Router({ mergeParams: true }); // mergeParams to access :id from parent router

router.post('/', validate(idParamSchema, 'params'), validate(querySchema, 'body'), queryRepository);

export default router;
