/**
 * Helpers for session state and ID parsing.
 */

/**
 * Parses a dayId string like "m1-w1-d3" into its components.
 * @param {string} dayId 
 * @returns {{ moduleNumber: number, weekNumber: number, dayNumber: number }}
 */
export const parseDayId = (dayId) => {
  if (!dayId) return { moduleNumber: 0, weekNumber: 0, dayNumber: 0 };
  const [m, w, d] = dayId.split("-");
  return {
    moduleNumber: parseInt(m?.replace("m", "")) || 0,
    weekNumber:   parseInt(w?.replace("w", "")) || 0,
    dayNumber:    parseInt(d?.replace("d", "")) || 0,
  };
};

/**
 * Builds a dayId string from components.
 */
export const buildDayId = (moduleNumber, weekNumber, dayNumber) =>
  `m${moduleNumber}-w${weekNumber}-d${dayNumber}`;

/**
 * Derives the current session object from the roadmap using progress state.
 */
export const getCurrentSession = (roadmapJson, progress) => {
  if (!roadmapJson || !progress) return null;
  
  const { currentModule, currentWeek, currentDay } = progress;
  
  const module = roadmapJson.modules.find(m => m.moduleNumber === currentModule);
  if (!module) return null;
  
  const week = module.weeks.find(w => w.weekNumber === currentWeek);
  if (!week) return null;
  
  const day = week.days.find(d => d.dayName === currentDay);
  if (!day) return null;
  
  return {
    ...day,
    dayId: buildDayId(currentModule, currentWeek, day.dayNumber),
    moduleNumber: currentModule,
    weekNumber: currentWeek,
    moduleTitle: module.title,
  };
};
