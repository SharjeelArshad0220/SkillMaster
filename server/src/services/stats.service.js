import { buildDayId, parseDayId, getDayFromRoadmap } from '../utils/dayHelpers.js';

export const calculateStats = (progress, roadmapJson) => {
  const lessonsCompleted = progress.completedDays?.filter(d => d.type === 'Learning').length || 0;
  const revisionSessions = progress.completedDays?.filter(d => d.type === 'Revision').length || 0;
  const examsAttempted = progress.examAttempts?.length || 0;
  const examsPassed = progress.examAttempts?.filter(e => e.passed).length || 0;

  const completedSessions = (progress.completedDays?.length || 0) + examsAttempted;
  const totalModules = roadmapJson.modules?.length || 0;
  
  // Count completed modules
  const completedModulesCount = roadmapJson.modules?.filter(mod => {
    const allDaysInModule = mod.weeks.flatMap(w =>
      w.days.map(d => buildDayId(mod.moduleNumber, w.weekNumber, d.dayNumber))
    );
    return allDaysInModule.length > 0 && allDaysInModule.every(dayId =>
      progress.completedDays?.some(cd => cd.dayId === dayId && cd.status === 'completed') ||
      progress.examAttempts?.some(ea => ea.dayId === dayId && ea.passed)
    );
  }).length || 0;
  
  // Defensive array access — works on both Mongoose doc arrays and plain arrays
  const examAttempts = Array.isArray(progress.examAttempts)
    ? progress.examAttempts
    : [];

  const lastAttempt = examAttempts.length > 0
    ? examAttempts[examAttempts.length - 1]
    : null;

  // Explicit type coercion to prevent null/undefined slipping through
  const latestExamScore = lastAttempt && lastAttempt.score !== undefined
    ? Number(lastAttempt.score)
    : null;

  const latestExamPassed = lastAttempt && lastAttempt.passed !== undefined
    ? Boolean(lastAttempt.passed)
    : null;

  const latestResult = lastAttempt
    ? (lastAttempt.passed ? 'Passed' : 'Failed')
    : null;

  const lastCompletedDay = progress.completedDays?.slice(-1)[0];
  
  // Determine actual last completed item
  let lastCompletedTitle = "None";
  let lastSessionOutcome = null;

  const lastCompDate = lastCompletedDay?.completedAt ? new Date(lastCompletedDay.completedAt) : new Date(0);
  const lastExamDate = lastAttempt?.attemptedAt ? new Date(lastAttempt.attemptedAt) : new Date(0);

  if (lastExamDate > lastCompDate) {
    const { moduleNumber, weekNumber, dayNumber } = parseDayId(lastAttempt.dayId);
    const mod = roadmapJson.modules?.find(m => m.moduleNumber === moduleNumber);
    let week = mod?.weeks?.find(w => w.weekNumber === weekNumber);
    if (!week && mod?.weeks) week = mod.weeks[weekNumber - 1];
    const day = week?.days?.find(d => d.dayNumber === dayNumber);

    lastCompletedTitle = day ? `Exam: ${day.dayName} Week ${weekNumber}` : "Final Exam";
    lastSessionOutcome = lastAttempt.passed ? "passed" : "failed";
  } else if (lastCompletedDay) {
    const { moduleNumber, weekNumber, dayNumber } = parseDayId(lastCompletedDay.dayId);
    const mod = roadmapJson.modules?.find(m => m.moduleNumber === moduleNumber);
    let week = mod?.weeks?.find(w => w.weekNumber === weekNumber);
    if (!week && mod?.weeks) week = mod.weeks[weekNumber - 1];
    const day = week?.days?.find(d => d.dayNumber === dayNumber);

    lastCompletedTitle = day?.title ?? `${lastCompletedDay.type || 'Learning'} Session`;
    lastSessionOutcome = lastCompletedDay.status;
  }
  
  return {
    completedSessions,
    modulesCompleted: `${completedModulesCount}/${totalModules}`,
    latestResult,
    revisionTopicsCount: progress.allWeakTopics?.length || 0,
    lessonsCompleted,
    revisionSessions,
    examsAttempted,
    examsPassed,
    lastCompletedTitle,
    lastSessionOutcome,
    latestExamScore,
    latestExamPassed,
    revisionQueue: progress.allWeakTopics || []
  };
};
