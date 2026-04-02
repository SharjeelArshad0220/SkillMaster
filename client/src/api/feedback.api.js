import api from "./axiosInstance";

/**
 * MOCK: Gets AI feedback for a task submission.
 */
export const getAIFeedback = async (roadmapId, dayId, userAnswer) => {
  // REAL CALL:
  // const res = await api.post("/feedback", { roadmapId, dayId, userAnswer });
  // return res.data;

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    feedback: "Great effort! Your implementation of the component correctly handles the requested states. You could improve readability by splitting the logic into smaller helper functions. Keep going!",
    outcome: "positive", // or "needs_improvement"
  };
};
