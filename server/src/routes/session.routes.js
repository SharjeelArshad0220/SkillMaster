import express from 'express';
import { getSession, submitTask, submitExam } from '../controllers/session.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:dayId', requireAuth, getSession);
router.post('/:dayId/submit', requireAuth, submitTask);
router.post('/:dayId/exam', requireAuth, submitExam);

export default router;
