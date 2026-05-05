import Roadmap from '../models/Roadmap.model.js';
import Progress from '../models/Progress.model.js';
import { generateRoadmapSkeleton } from '../services/ai.service.js';

export const generateRoadmap = async (req, res) => {
  try {
    const {
      skillInput,
      motivation,
      dailyTime,
      role,
      currentLevel,
      learningStyle,
      goalClarity
    } = req.body;

    if (!skillInput || skillInput.trim() === '') {
      return res.status(400).json({ error: 'skillInput is required.' });
    }

    const roadmapJson = await generateRoadmapSkeleton({
      skillInput,
      motivation: motivation || '',
      currentLevel: currentLevel || '',
      role: role || '',
      learningStyle: learningStyle || '',
      goalClarity: goalClarity || '',
      dailyTime: dailyTime || ''
    });

    if (!roadmapJson || !roadmapJson.modules || roadmapJson.modules.length === 0) {
      throw new Error('GEMINI_FAILURE');
    }

    const setupData = {
      skillInput, motivation, dailyTime, role, currentLevel, learningStyle, goalClarity
    };

    const roadmap = await Roadmap.create({
      userId: req.userId,
      skillName: roadmapJson.skillName,
      setupData,
      roadmapJson
    });

    await Progress.create({
      userId: req.userId,
      roadmapId: roadmap._id,
      currentModule: 1,
      currentWeek: 1,
      currentDay: 'Monday',
      weeklyWeakTopics: {},
      allWeakTopics: [],
      completedDays: [],
      examAttempts: []
    });

    res.status(201).json({ roadmapId: roadmap._id, roadmapJson: roadmap.roadmapJson });
  } catch (error) {
    console.error('Roadmap Generation Error:', error);
    if (error.message === 'GEMINI_FAILURE' || error.message === 'JSON_PARSE_FAILURE') {
      return res.status(500).json({ error: 'Failed to generate roadmap. Please try again.' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getActiveRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!roadmap) {
      return res.status(200).json({ roadmapId: null, roadmapJson: null, progress: null, stats: null });
    }

    const progress = await Progress.findOne({ userId: req.userId, roadmapId: roadmap._id });
    
    // Stats service not yet available, return null for now as per plan
    res.status(200).json({
      roadmapId: roadmap._id,
      roadmapJson: roadmap.roadmapJson,
      progress,
      stats: null
    });
  } catch (error) {
    console.error('Get Active Roadmap Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.roadmapId, userId: req.userId });
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }
    res.status(200).json({ roadmapId: roadmap._id, roadmapJson: roadmap.roadmapJson });
  } catch (error) {
    console.error('Get Roadmap Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
