import api from "./axiosInstance";
import mockRoadmap from "../mocks/roadmap.json";

/**
 * MOCK: Generates a new learning roadmap based on user setup data.
 */
export const generateRoadmap = async (setupData) => {
  // REAL CALL:
  // const res = await api.post("/roadmap/generate", setupData);
  // return res.data;

  // Simulate AI generation delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    roadmapId: "rdmp_001",
    roadmapJson: mockRoadmap,
  };
};

/**
 * MOCK: Retrieves an existing roadmap by ID.
 */
export const getRoadmap = async (roadmapId) => {
  // REAL CALL:
  // const res = await api.get(`/roadmap/${roadmapId}`);
  // return res.data;

  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    roadmapId,
    roadmapJson: mockRoadmap,
  };
};

/**
 * MOCK: Gets the user's active roadmap.
 */
export const getActiveRoadmap = async () => {
  // REAL CALL:
  // const res = await api.get("/roadmap/active");
  // return res.data;

  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    roadmapId: "rdmp_001",
    roadmapJson: mockRoadmap,
  };
};
