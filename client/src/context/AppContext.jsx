import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getActiveRoadmap } from "../api/roadmap.api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [roadmapId, setRoadmapId] = useState(null);
  const [roadmapJson, setRoadmapJson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoadmapId(null);
      setRoadmapJson(null);
      setProgress(null);
      setRoadmapLoading(false);
      return;
    }
    setRoadmapLoading(true);
    getActiveRoadmap()
      .then((data) => {
        if (data.roadmapId) {
          setRoadmapId(data.roadmapId);
          setRoadmapJson(data.roadmapJson);
          setProgress(data.progress);
        }
      })
      .catch((err) => {
        console.error('Failed to load active roadmap:', err);
      })
      .finally(() => {
        setRoadmapLoading(false);
      });
  }, [user]);

  const setRoadmapData = (id, json, prog) => {
    setRoadmapId(id);
    setRoadmapJson(json);
    setProgress(prog);
  };

  const refreshProgress = async () => {
    try {
      const data = await getActiveRoadmap();
      setProgress(data.progress);
    } catch (err) {
      console.error("Failed to refresh progress", err);
    }
  };

  return (
    <AppContext.Provider value={{
      roadmapId, roadmapJson, progress, roadmapLoading,
      setRoadmapData, refreshProgress
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
