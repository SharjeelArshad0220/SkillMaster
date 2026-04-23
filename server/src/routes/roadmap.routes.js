import express from 'express';
import { generateRoadmap, getActiveRoadmap, getRoadmap } from '../controllers/roadmap.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Note: /active MUST come before /:roadmapId
router.post('/generate', requireAuth, generateRoadmap);
router.get('/active', requireAuth, getActiveRoadmap);
router.get('/:roadmapId', requireAuth, getRoadmap);

export default router;
