import express from 'express';
import { createPlan, getPlan, deletePlan } from '../controllers/planController.js';

const router = express.Router();

router.post('/api/v1/data', createPlan);
router.get('/api/v1/data/:id', getPlan);
router.delete('/api/v1/data/:id', deletePlan);

export default router;