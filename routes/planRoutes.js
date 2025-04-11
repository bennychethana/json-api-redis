import express from 'express';
import { createPlan, getPlan, deletePlan, patchPlan } from '../controllers/planController.js';

const router = express.Router();

router.post('/api/v1/data', createPlan);
router.get('/api/v1/data/:id', getPlan);
router.delete('/api/v1/data/:id', deletePlan);
router.patch('/api/v1/data/:id', patchPlan);

export default router;