import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { HiCheckCircle, HiLockClosed, HiArrowRight, HiMap } from "react-icons/hi2";

export default function RoadmapPage() {
  const { roadmapJson, progress } = useApp();
  const navigate = useNavigate();

  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);

  // Edge Case: No roadmap generated
  if (!roadmapJson) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center font-sans blueprint-grid">
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-navy-mid flex items-center justify-center mb-8 border border-gray-200 dark:border-divider shadow-xl">
          <HiMap className="w-10 h-10 text-accent-dk dark:text-accent" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight text-shadow-sm">
          Destiny Awaits
        </h2>
        <p className="text-base text-gray-500 dark:text-muted max-w-sm mb-10 leading-relaxed">
          You haven't charted your course yet. Set up your learning profile to generate a personalized roadmap tailored to your goals.
        </p>
        <Button size="lg" onClick={() => navigate("/setup")} className="px-10 shadow-lg shadow-accent/20">
          Begin Journey
        </Button>
      </div>
    );
  }

  const activeModule = roadmapJson.modules[activeModuleIdx];
  const activeWeek = activeModule?.weeks?.[activeWeekIdx];

  const getDayStatus = (day) => {
    if (progress?.currentModule === activeModuleIdx + 1 &&
        progress?.currentWeek === activeWeekIdx + 1 &&
        progress?.currentDay === day.dayName) return "current";
    
    // Progression logic
    const currentM = progress?.currentModule || 1;
    const currentW = progress?.currentWeek || 1;

    if (activeModuleIdx + 1 < currentM) return "passed";
    if (activeModuleIdx + 1 === currentM && activeWeekIdx + 1 < currentW) return "passed";
    return "locked";
  };

  return (
    <div className="min-h-screen blueprint-grid">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12 space-y-10 font-sans">
        
        {/* Page Header */}
        <section className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-accent-dk dark:bg-accent rounded-full" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-dk dark:text-accent">
              Architectural Plan
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Your Learning Roadmap
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-slate">
            A precision-engineered curriculum for <span className="text-accent-dk dark:text-accent font-bold">{roadmapJson.skillName}</span>.
          </p>
        </section>

        {/* Improved Summary Grid: Individual Opaque Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <StatItem label="Active Skill" value={roadmapJson.skillName} />
          <StatItem label="Target Level" value={roadmapJson.level} />
          <StatItem label="Modules" value={roadmapJson.totalModules} />
          <StatItem label="Duration" value={`${roadmapJson.estimatedWeeks} Weeks`} />
          <StatItem label="Status" value={progress ? "In Progress" : "Pending"} isAccent />
        </section>

        {/* Module Navigation */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Course Modules</h2>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent" /> Active</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pass" /> Done</span>
            </div>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide snap-x">
            {roadmapJson.modules.map((mod, idx) => {
              const isActive = activeModuleIdx === idx;
              const currentM = progress?.currentModule || 1;
              const isCompleted = idx + 1 < currentM;
              const isLocked = idx + 1 > currentM;
              
              return (
                <div 
                  key={idx}
                  onClick={() => { setActiveModuleIdx(idx); setActiveWeekIdx(0); }}
                  className={`flex-shrink-0 w-[240px] md:flex-1 p-5 rounded-xl flex flex-col justify-between h-36 cursor-pointer transition-all border-2 snap-start relative z-10
                    ${isActive 
                      ? "bg-white dark:bg-navy-mid border-accent-dk dark:border-accent shadow-lg shadow-accent/10 ring-4 ring-accent/5" 
                      : "bg-white dark:bg-navy-mid border-gray-200 dark:border-divider hover:border-gray-300 dark:hover:border-navy-light shadow-sm"}`}
                >
                  <div className="relative">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-accent-dk dark:text-accent" : "text-muted"}`}>
                        Module {String(idx + 1).padStart(2, '0')}
                      </span>
                      {isCompleted ? (
                        <HiCheckCircle className="text-pass w-5 h-5" />
                      ) : isLocked ? (
                        <HiLockClosed className="text-gray-300 dark:text-muted w-4 h-4" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-accent-dk dark:bg-accent animate-pulse" />
                      )}
                    </div>
                    <h3 className={`font-bold mt-2 leading-tight text-sm md:text-base line-clamp-2 ${isActive ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-slate"}`}>
                      {mod.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border 
                      ${isActive 
                        ? "bg-accent/5 border-accent/20 text-accent-dk dark:text-accent" 
                        : "bg-gray-50 dark:bg-navy border-gray-100 dark:border-divider text-gray-500 dark:text-muted"}`}>
                      {mod.weeks.length} Weeks
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Curriculum Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Weeks Selector: Opaque, high-contrast cards */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-muted">Weekly Phases</h2>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
              {activeModule.weeks.map((week, idx) => {
                const isActive = activeWeekIdx === idx;
                return (
                  <div 
                    key={idx}
                    onClick={() => setActiveWeekIdx(idx)}
                    className={`flex-shrink-0 lg:w-full p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all border
                      ${isActive 
                        ? "bg-accent-dk dark:bg-accent text-white dark:text-navy border-accent-dk dark:border-accent shadow-md md:scale-[1.02]" 
                        : "bg-white dark:bg-navy-mid text-gray-700 dark:text-slate border-gray-200 dark:border-divider hover:bg-gray-50 dark:hover:bg-navy-light shadow-sm"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner
                        ${isActive ? "bg-white/20" : "bg-gray-100 dark:bg-navy text-muted"}`}>
                        W{week.weekNumber}
                      </div>
                      <span className="text-sm font-semibold truncate max-w-[140px] md:max-w-none">
                        Weekly Sprint {week.weekNumber}
                      </span>
                    </div>
                    <HiArrowRight className={`text-sm hidden lg:block ${isActive ? "opacity-100" : "opacity-0"}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Days Curriculum: Improved visibility */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-navy-mid p-6 md:p-8 rounded-xl border border-gray-200 dark:border-divider shadow-md gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-muted truncate">Week {activeWeekIdx + 1} Curriculum</h2>
                <p className="text-xs text-gray-500 dark:text-muted mt-1 hidden md:block">Tactical learning objectives for this phase.</p>
              </div>
              <Button onClick={() => navigate("/learn")} size="md" className="shrink-0 shadow-sm">Get Started</Button>
            </div>

            <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-divider divide-y divide-gray-100 dark:divide-divider rounded-xl overflow-hidden shadow-md">
              {activeWeek?.days.map((day, idx) => {
                const status = getDayStatus(day);
                return (
                  <div key={idx} className={`p-4 md:p-6 flex items-center gap-4 md:gap-6 transition-all bg-white dark:bg-navy-mid ${status === "locked" ? "opacity-50" : "hover:bg-gray-50/50 dark:hover:bg-navy-light/30"}`}>
                    <div className="flex flex-col items-center gap-1 min-w-[40px]">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        status === "current" ? "bg-accent border-accent animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.5)]" : 
                        status === "passed" ? "bg-pass border-pass" : "border-divider bg-transparent"
                      }`} />
                      <div className={`w-0.5 flex-1 bg-gray-100 dark:bg-divider ${idx === activeWeek.days.length - 1 ? "hidden" : ""}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Day {day.dayNumber}</span>
                        <Badge variant={day.type.toLowerCase()}>{day.type}</Badge>
                      </div>
                      <h4 className="text-[15px] md:text-base font-bold text-gray-900 dark:text-white leading-tight">
                        {day.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-slate mt-1 leading-relaxed line-clamp-1">
                        Comprehensive tactical lesson on {day.title.toLowerCase()}.
                      </p>
                    </div>
                    <Badge variant={status === "current" ? "current" : status === "passed" ? "passed" : "locked"}>
                      {status.toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>
            
            {/* Mobile secondary CTA */}
            <div className="lg:hidden mt-4 pt-2">
              <Button fullWidth onClick={() => navigate("/learn")}>Enter Dashboard</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatItem({ label, value, isAccent }) {
  return (
    <div className={`p-5 md:p-6 flex flex-col items-center lg:items-start justify-center text-center lg:text-left rounded-xl border transition-all shadow-sm bg-white dark:bg-navy-mid
      ${isAccent ? "border-accent/40 bg-accent/5 dark:bg-accent/5 shadow-accent/5" : "border-gray-200 dark:border-divider"}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-muted mb-1 md:mb-2">{label}</span>
      <span className={`text-[15px] md:text-lg font-extrabold truncate w-full leading-none
        ${isAccent ? "text-accent-dk dark:text-accent" : "text-gray-900 dark:text-white"}`}>
        {value}
      </span>
    </div>
  );
}
