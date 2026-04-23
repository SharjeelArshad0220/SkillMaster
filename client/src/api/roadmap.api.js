import api from './axiosInstance';

/**
 * Generates a new roadmap.
 * POST /roadmap/generate
 */
export const generateRoadmap = async (data) => {
  const res = await api.post('/roadmap/generate', data);
  return res.data;
};

/**
 * Gets the active roadmap and progress.
 * GET /roadmap/active
 */
export const getActiveRoadmap = async () => {
  const res = await api.get('/roadmap/active');
  return res.data;
};
