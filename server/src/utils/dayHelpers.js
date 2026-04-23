import jwt from 'jsonwebtoken';

/**
 * Creates a JWT token for a given user ID
 * @param {string|ObjectId} userId - The user's ID
 * @returns {string} The signed JWT token
 */
export const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export const parseDayId = (dayId) => {
  const [m, w, d] = dayId.split('-');
  return {
    moduleNumber: parseInt(m.replace('m', '')),
    weekNumber: parseInt(w.replace('w', '')),
    dayNumber: parseInt(d.replace('d', ''))
  };
};

export const buildDayId = (m, w, d) => `m${m}-w${w}-d${d}`;

export const getDayFromRoadmap = (roadmapJson, moduleNumber, weekNumber, dayNumber) => {
  const mod = roadmapJson.modules.find(m => m.moduleNumber === moduleNumber);
  if (!mod) return null;
  let week = mod.weeks.find(w => w.weekNumber === weekNumber);
  if (!week && mod.weeks) week = mod.weeks[weekNumber - 1]; // Array index fallback
  if (!week) return null;
  return week.days.find(d => d.dayNumber === dayNumber) || null;
};


/**
 * Given current position, returns the next learning position.
 * This is the SINGLE SOURCE OF TRUTH for day advancement.
 * Used by: advanceProgress controller, submitExam controller (on pass).
 * 
 * @param {number} moduleNumber - Current module (1-indexed)
 * @param {number} weekNumber - Current week (1-indexed within module)
 * @param {number} dayNumber - Current day (1-7, where 1=Monday, 7=Sunday)
 * @param {object} roadmapJson - Full roadmap JSON from DB
 * @returns {{ newModule, newWeek, newDay, roadmapComplete }}
 */
export const calculateNextPosition = (moduleNumber, weekNumber, dayNumber, roadmapJson) => {
  const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  // dayNumber is 1-indexed. DAY_NAMES is 0-indexed.
  // Current day name: DAY_NAMES[dayNumber - 1]
  // Next day name: DAY_NAMES[dayNumber] (which is dayNumber+1 but 0-indexed)

  // Case 1: Not Sunday yet — advance to next day in same week
  if (dayNumber < 7) {
    return {
      newModule: moduleNumber,
      newWeek: weekNumber,
      newDay: DAY_NAMES[dayNumber], // dayNumber is 1-6, so dayNumber index = next day
      roadmapComplete: false
    };
  }

  // Case 2: Sunday done — try next week in current module
  const currentMod = roadmapJson.modules.find(m => m.moduleNumber === moduleNumber);
  if (!currentMod) {
    console.error(`calculateNextPosition: module ${moduleNumber} not found in roadmap`);
    return { newModule: moduleNumber, newWeek: weekNumber, newDay: 'Monday', roadmapComplete: false };
  }

  const nextWeek = currentMod.weeks.find(w => w.weekNumber === weekNumber + 1);
  if (nextWeek) {
    return {
      newModule: moduleNumber,
      newWeek: weekNumber + 1,
      newDay: 'Monday',
      roadmapComplete: false
    };
  }

  // Case 3: Last week of module done — try next module
  const nextModule = roadmapJson.modules.find(m => m.moduleNumber === moduleNumber + 1);
  if (nextModule) {
    return {
      newModule: moduleNumber + 1,
      newWeek: 1,
      newDay: 'Monday',
      roadmapComplete: false
    };
  }

  // Case 4: Last module, last week, Sunday done — roadmap complete
  return {
    newModule: moduleNumber,
    newWeek: weekNumber,
    newDay: 'Monday', // Doesn't matter — frontend checks roadmapComplete flag
    roadmapComplete: true
  };
};