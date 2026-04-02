import api from "./axiosInstance";

/**
 * MOCK: Updates user progress after completing a session.
 * @param {string} roadmapId 
 * @param {string} dayId 
 * @param {string} status 'passed' | 'failed'
 */
export const updateProgress = async (roadmapId, dayId, status) => {
  // REAL CALL:
  // const res = await api.post("/progress/update", { roadmapId, dayId, status });
  // return res.data;

  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    success: true,
    newDay: "Tuesday", // Mock advancement logic
    newWeek: 1,
    newModule: 1,
    roadmapComplete: false,
  };
};

/**
 * MOCK: Records an exam result and updates weak topics.
 */
export const updateExamResult = async (roadmapId, dayId, score, passed, weakTopics) => {
  // REAL CALL:
  // const res = await api.post("/progress/exam", { roadmapId, dayId, score, passed, weakTopics });
  // return res.data;

  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    success: true,
    passed,
    score,
    newDay: passed ? "Monday" : "Saturday",
    weakTopics,
  };
};

/**
 * MOCK: Retrieves the full progress object for a roadmap.
 */
export const getProgress = async (roadmapId) => {
  // REAL CALL:
  // const res = await api.get(`/progress/${roadmapId}`);
  // return res.data;

  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    progress: {
      roadmapId,
      currentModule: 1,
      currentWeek: 1,
      currentDay: "Monday",
      completedTasks: [],
      weakTopics: [],
      examScores: [],
    },
  };
};
