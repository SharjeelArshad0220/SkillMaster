import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { generateRoadmap, getRoadmap } from "../api/roadmap.api";
import { updateProgress as updateProgressApi, getProgress, updateExamResult as updateExamApi } from "../api/progress.api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [roadmapJson, setRoadmapJson]   = useState(null);
  const [roadmapId, setRoadmapId]       = useState(null);
  const [progress, setProgress]         = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRestoring, setIsRestoring]   = useState(true);

  // --- PERSISTENCE: RESTORE STATE ON MOUNT ---
  useEffect(() => {
    const restoreState = async () => {
      const storedId = localStorage.getItem("sm_roadmap_id");
      
      if (user && storedId) {
        try {
          const roadmapData = await getRoadmap(storedId);
          const progressData = await getProgress(storedId);
          
          setRoadmapId(storedId);
          setRoadmapJson(roadmapData.roadmapJson);
          setProgress(progressData.progress);
        } catch (err) {
          console.error("Failed to restore state:", err);
          localStorage.removeItem("sm_roadmap_id");
        }
      }
      setIsRestoring(false);
    };

    restoreState();
  }, [user]);

  const createRoadmap = async (setupData) => {
    setIsGenerating(true);
    try {
      const data = await generateRoadmap(setupData);
      localStorage.setItem("sm_roadmap_id", data.roadmapId);
      setRoadmapId(data.roadmapId);
      setRoadmapJson(data.roadmapJson);
      
      // Default progress handled by getProgress/updateProgressApi
      const progressData = await getProgress(data.roadmapId);
      setProgress(progressData.progress);
      return data;
    } finally {
      setIsGenerating(false);
    }
  };

  const advanceProgress = async (dayId, status) => {
    const data = await updateProgressApi(roadmapId, dayId, status);
    if (data.success) {
      setProgress(data.progress);
    }
    return data;
  };

  const completeExamProgress = async (dayId, score, passed, weakTopics) => {
    const data = await updateExamApi(roadmapId, dayId, score, passed, weakTopics);
    if (data.success) {
      setProgress(data.progress);
    }
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
      roadmapJson, roadmapId, progress, isGenerating, isRestoring,
      createRoadmap, advanceProgress, completeExamProgress, addWeakTopics
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
