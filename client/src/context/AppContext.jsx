import { createContext, useContext, useState } from "react";
import { generateRoadmap, getRoadmap } from "../api/roadmap.api";
import { updateProgress as updateProgressApi, getProgress } from "../api/progress.api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [roadmapJson, setRoadmapJson]   = useState(null);
  const [roadmapId, setRoadmapId]       = useState(null);
  const [progress, setProgress]         = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const createRoadmap = async (setupData) => {
    setIsGenerating(true);
    try {
      const data = await generateRoadmap(setupData);
      setRoadmapId(data.roadmapId);
      setRoadmapJson(data.roadmapJson);
      // Init default progress
      const initialProgress = {
        roadmapId: data.roadmapId,
        currentModule: 1, currentWeek: 1, currentDay: "Monday",
        completedTasks: [], weakTopics: [], examScores: []
      };
      setProgress(initialProgress);
      return data;
    } finally {
      setIsGenerating(false);
    }
  };

  const advanceProgress = async (dayId, status) => {
    const data = await updateProgressApi(roadmapId, dayId, status);
    setProgress(prev => ({ ...prev, currentDay: data.newDay }));
    return data;
  };

  const addWeakTopics = (topics) => {
    setProgress(prev => ({
      ...prev,
      weakTopics: [...new Set([...prev.weakTopics, ...topics])]
    }));
  };

  return (
    <AppContext.Provider value={{
      roadmapJson, roadmapId, progress, isGenerating,
      createRoadmap, advanceProgress, addWeakTopics
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
