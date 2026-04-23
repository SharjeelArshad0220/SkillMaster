import Progress from '../models/Progress.model.js';
import Roadmap from '../models/Roadmap.model.js';
import { calculateStats } from '../services/stats.service.js';
import { calculateNextPosition, parseDayId, getDayFromRoadmap } from '../utils/dayHelpers.js';

export const advanceProgress = async (req, res) => {
  try {
    const { roadmapId, dayId, status } = req.body;
    const userId = req.userId;

    if (!roadmapId || !dayId || !status) {
      return res.status(400).json({ error: "roadmapId, dayId, and status are required" });
    }

    const progress = await Progress.findOne({ userId, roadmapId });
    if (!progress) {
      return res.status(404).json({ error: "Progress record not found" });
    }

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId }).lean();
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    // Parse dayId to get numeric positions
    const { moduleNumber, weekNumber, dayNumber } = parseDayId(dayId);

    // Determine day type from roadmap structure
    const dayData = getDayFromRoadmap(roadmap.roadmapJson, moduleNumber, weekNumber, dayNumber);
    const dayType = dayData?.type || 'Learning';

    // Push to completedDays — only push if not already there
    const alreadyCompleted = progress.completedDays.some(d => d.dayId === dayId);
    if (!alreadyCompleted) {
      progress.completedDays.push({
        dayId,
        type: dayType,
        status,
        completedAt: new Date()
      });
    }

    // Use shared utility — single source of truth for day arithmetic
    const { newModule, newWeek, newDay, roadmapComplete } = calculateNextPosition(
      moduleNumber,
      weekNumber,
      dayNumber,
      roadmap.roadmapJson
    );

    if (!roadmapComplete) {
      progress.currentModule = newModule;
      progress.currentWeek = newWeek;
      progress.currentDay = newDay;
    }

    await progress.save();

    return res.status(200).json({
      success: true,
      newDay,
      newWeek,
      newModule,
      roadmapComplete: roadmapComplete || false
    });

  } catch (error) {
    console.error("advanceProgress error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getStats = async (req, res) => {
  try {
    const { roadmapId } = req.query;
    if (!roadmapId) {
      return res.status(400).json({ error: "roadmapId query param is required" });
    }

    // .lean() returns plain JS objects — fixes Mongoose getter issues on Mixed fields
    const progress = await Progress.findOne({
      userId: req.userId,
      roadmapId
    }).lean();

    if (!progress) {
      return res.status(404).json({ error: "Progress not found" });
    }

    const roadmap = await Roadmap.findOne({
      _id: roadmapId,
      userId: req.userId
    }).lean();

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    const stats = calculateStats(progress, roadmap.roadmapJson);
    return res.status(200).json(stats);

  } catch (error) {
    console.error("getStats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
