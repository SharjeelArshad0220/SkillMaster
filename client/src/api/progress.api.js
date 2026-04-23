import api from './axiosInstance';

/**
 * Advances user progress.
 * POST /progress/advance
 */
export const advanceProgress = async (roadmapId, dayId, status) => {
  const res = await api.post('/progress/advance', { roadmapId, dayId, status });
  return res.data;
};

/**
 * Gets detailed stats for a roadmap.
 * GET /progress/stats?roadmapId=X
 */
export const getStats = async (roadmapId) => {
  const res = await api.get('/progress/stats', { params: { roadmapId } });
  return res.data;
};
