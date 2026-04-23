import express from 'express';
import { advanceProgress, getStats } from '../controllers/progress.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/advance', requireAuth, advanceProgress);
router.get('/stats', requireAuth, getStats);

export default router;
