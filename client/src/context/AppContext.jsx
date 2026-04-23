import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getActiveRoadmap } from "../api/roadmap.api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [roadmapId, setRoadmapId] = useState(null);
  const [roadmapJson, setRoadmapJson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchActive = async () => {
        setLoading(true);
        try {
          const data = await getActiveRoadmap();
          if (data.roadmapId) {
            setRoadmapId(data.roadmapId);
            setRoadmapJson(data.roadmapJson);
            setProgress(data.progress);
          }
        } catch (err) {
          console.error("Failed to fetch active roadmap", err);
        } finally {
          setLoading(false);
        }
      };
      fetchActive();
    } else {
      // Clear data when user logs out or is null
      setRoadmapId(null);
      setRoadmapJson(null);
      setProgress(null);
    }
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
      roadmapId, roadmapJson, progress, loading,
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
