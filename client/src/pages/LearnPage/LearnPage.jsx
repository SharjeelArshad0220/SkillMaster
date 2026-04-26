import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

const getCurrentSession = (roadmapJson, progress) => {
  if (!roadmapJson || !progress) return null;
  const DAY_MAP = { Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6, Sunday:7 };
  const dayNumber = DAY_MAP[progress.currentDay];
  const mod = roadmapJson.modules?.find(m => m.moduleNumber === progress.currentModule);
  if (!mod) return null;

  // CRITICAL FIX: weeks may be numbered globally (3,4,5...) or locally (1,2).
  // Try finding by weekNumber first, then fall back to array index.
  let week = mod?.weeks?.find(w => w.weekNumber === progress.currentWeek);
  if (!week && mod?.weeks?.length > 0) {
    // Fallback: use 0-indexed access (currentWeek 1 = index 0)
    week = mod.weeks[progress.currentWeek - 1];
  }
  if (!week) return null;

  const day = week?.days?.find(d => d.dayNumber === dayNumber);
  if (!day) return null;
  
  return {
    dayId: `m${progress.currentModule}-w${progress.currentWeek}-d${dayNumber}`,
    title: day.title,
    type: day.type,
    dayName: day.dayName,
    dayNumber,
    moduleNumber: progress.currentModule,
    weekNumber: progress.currentWeek,
    moduleTitle: mod.title,
    weekTitle: week.title,
  };
};

/**
 * Milestone F2 — Learn / Dashboard Page
 * Main landing page for authenticated users. Shows stats, current session, and revision queue.
 */
export default function LearnPage() {
  const { roadmapJson, progress, roadmapLoading } = useApp();
  const navigate = useNavigate();

  // STATE 1: Still loading
  if (roadmapLoading) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-dk dark:border-accent
                          border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400 dark:text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // STATE 2: Confirmed no roadmap (loading done, roadmapJson is null)
  if (!roadmapJson || !progress) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-navy-mid
                          flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400 dark:text-muted" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13
                       C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13
                       C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13
                       C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              No learning roadmap yet
            </h3>
            <p className="text-sm text-gray-400 dark:text-muted max-w-[300px]">
              Set up your learning profile to generate a personalised roadmap.
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/setup')}>
            Create My Roadmap
          </Button>
        </div>
      </div>
    );
  }

  const currentSession = getCurrentSession(roadmapJson, progress);

  // Fallback: roadmap complete or inconsistent state
  if (!currentSession) {
    const isRoadmapComplete = progress.currentModule > roadmapJson?.modules?.length;
    return (
      <div className="max-w-[900px] mx-auto px-5 py-20 text-center font-sans animate-fade-in">
        <div className="w-16 h-16 bg-pass/10 dark:bg-pass/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-pass/20">
          <svg className="w-8 h-8 text-pass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {isRoadmapComplete ? "Roadmap Complete!" : "Module Complete"}
        </h2>
        {/* <p className="text-sm text-gray-500 dark:text-muted mb-8 max-w-sm mx-auto leading-relaxed">
          {isRoadmapComplete 
            ? `Congratulations! You have completed the entire roadmap for ${roadmapJson.skillName}.`
            : `You've completed all scheduled sessions for Module ${progress.currentModule}. Check your progress to see what's next.`}
        </p> */}
        <p className="text-sm text-gray-500 dark:text-muted mb-8 max-w-sm mx-auto leading-relaxed">
          {isRoadmapComplete 
            ? `Congratulations! You have completed the entire roadmap for ${roadmapJson.skillName}.`
            : `You've completed all scheduled sessions for Module ${progress.currentModule - 1}. 
              Module ${progress.currentModule} is now unlocked. Start your next session below.`}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate("/progress")}>View Progress Stats</Button>
          <Button variant="secondary" onClick={() => navigate("/roadmap")}>Review Roadmap</Button>
        </div>
      </div>
    );
  }

  const weakTopics = progress.allWeakTopics || [];

  return (
    <div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-muted mt-1">Pick up where you left off.</p>
        <p className="text-[10px] text-accent-dk dark:text-accent mt-2 uppercase tracking-[0.14em] font-bold">
          ACTIVE SKILL: {roadmapJson.skillName}
        </p>
      </div>

      {/* Stats Cards Section (2 columns on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="CURRENT MODULE" value={`Module ${progress.currentModule}`} />
        <StatCard label="CURRENT WEEK"   value={`Week ${progress.currentWeek}`} />
        <StatCard label="CURRENT DAY"    value={progress.currentDay} />
        <StatCard label="REVISION QUEUE" value={`${progress.allWeakTopics?.length ?? 0} Topics`} />
      </div>

      {/* Prominent Session Card (Responsive logic: flex-col on mobile, flex-row on desktop) */}
      <div className="bg-white dark:bg-navy-mid
                      border-[1.5px] border-accent-dk dark:border-accent
                      rounded-xl p-6 md:p-7 mb-8
                      shadow-[0_0_0_4px_rgba(14,165,233,0.08)] dark:shadow-[0_0_0_4px_rgba(56,189,248,0.08)]">
        
        <div className="flex flex-col md:flex-row md:gap-6">
          {/* LEFT — Session Details */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3.5">
              <Badge variant={currentSession.type.toLowerCase()}>{currentSession.type}</Badge>
              <Badge variant="locked">Day {currentSession.dayNumber}</Badge>
              <Badge variant="current">Ready to Continue</Badge>
            </div>

            <h2 className="text-xl md:text-xl font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
              {currentSession.title}
            </h2>

            <p className="text-sm text-gray-400 dark:text-muted mb-3 font-medium">
              Day {currentSession.dayNumber} — {currentSession.dayName} · Module {currentSession.moduleNumber} · Week {currentSession.weekNumber}
            </p>

            <p className="text-sm text-gray-600 dark:text-slate mb-6 max-w-[95%] leading-relaxed">
              Continue with today's {currentSession.type.toLowerCase()} session. 
              Complete the lesson and tasks to advance your skills.
            </p>

            <Button variant="primary" fullWidth={false} onClick={() => navigate(`/session/${currentSession.dayId}`)}>
              Continue Session
            </Button>
          </div>

          {/* Vertical Spacer (Desktop only) */}
          <div className="hidden md:block w-px bg-gray-200 dark:bg-divider self-stretch" />

          {/* RIGHT — Estimated Time (Desktop only) */}
          <div className="hidden md:flex flex-col items-center justify-center w-36 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em]
                          text-gray-400 dark:text-muted mb-2 text-center">ESTIMATED TIME</p>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white">45</p>
            <p className="text-xs font-semibold text-gray-400 dark:text-muted mt-1">min</p>
          </div>
        </div>
      </div>

      {/* Revision Queue List */}
      <div className="pb-10 md:pb-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                      text-accent-dk dark:text-accent mb-3.5">
          REVISION QUEUE
        </p>
        <div className="bg-white dark:bg-navy-mid
                        border border-gray-200 dark:border-navy-light
                        rounded-xl overflow-hidden shadow-sm">
          {weakTopics.length === 0 ? (
            <div className="px-5 py-6 flex items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-gray-400 dark:text-muted">
                  No revision topics yet
                </p>
                <p className="text-[11px] text-gray-300 dark:text-navy-light mt-0.5">
                  Complex topics will appear here for review
                </p>
              </div>
            </div>
          ) : (
            weakTopics.map((topic, i) => (
              <div key={i}
                   className={`flex items-center justify-between h-[56px] px-5
                     ${i < weakTopics.length - 1
                       ? "border-b border-gray-100 dark:border-divider"
                       : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-divider flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate">
                    {topic}
                  </span>
                </div>
                <Badge variant="needs-revision">Revision Needed</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
