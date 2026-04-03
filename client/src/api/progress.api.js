import api from "./axiosInstance";

const PROGRESS_KEY = "sm_user_progress";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * UTILITY: Gets progress from localStorage or initializes default.
 */
const getStoredProgress = (roadmapId) => {
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.roadmapId === roadmapId) return parsed;
  }
  
  // Default Initial State
  return {
    roadmapId,
    currentModule: 1,
    currentWeek: 1,
    currentDay: "Monday",
    completedTasks: [],
    weakTopics: [],
    examScores: [],
    lastUpdated: new Date().toISOString()
  };
};

const saveStoredProgress = (progress) => {
  progress.lastUpdated = new Date().toISOString();
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * MOCK: Updates user progress after completing a session.
 */
export const updateProgress = async (roadmapId, dayId, status) => {
  await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate latency
  
  const prog = getStoredProgress(roadmapId);
  const currentIdx = DAYS.indexOf(prog.currentDay);
  
  let nextDay = prog.currentDay;
  let nextWeek = prog.currentWeek;
  let nextModule = prog.currentModule;

  // Simple sequential advancement for non-exam days
  if (currentIdx < 6) { // Monday through Saturday
    nextDay = DAYS[currentIdx + 1];
  } else {
    // Sunday (Exam) is handled by updateExamResult
  }

  prog.currentDay = nextDay;
  prog.currentWeek = nextWeek;
  prog.currentModule = nextModule;
  
  if (dayId && !prog.completedTasks.includes(dayId)) {
    prog.completedTasks.push(dayId);
  }

  saveStoredProgress(prog);

  return {
    success: true,
    progress: prog,
    newDay: nextDay,
    newWeek: nextWeek,
    newModule: nextModule
  };
};

/**
 * MOCK: Records an exam result and updates weak topics.
 */
export const updateExamResult = async (roadmapId, dayId, score, passed, weakTopics) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  const prog = getStoredProgress(roadmapId);
  
  prog.examScores.push({ dayId, score, passed, date: new Date().toISOString() });
  prog.weakTopics = [...new Set([...prog.weakTopics, ...weakTopics])];

  if (passed) {
    // Advance to next week
    if (prog.currentWeek < 4) {
      prog.currentWeek += 1;
      prog.currentDay = "Monday";
    } else {
      // Advance to next module
      prog.currentModule += 1;
      prog.currentWeek = 1;
      prog.currentDay = "Monday";
    }
  } else {
    // Pedagogical Penalty: Go back to Saturday (Revision)
    prog.currentDay = "Saturday";
  }

  saveStoredProgress(prog);

  return {
    success: true,
    passed,
    score,
    progress: prog,
    newDay: prog.currentDay
  };
};

/**
 * MOCK: Retrieves the full progress object for a roadmap.
 */
export const getProgress = async (roadmapId) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    progress: getStoredProgress(roadmapId)
  };
};
