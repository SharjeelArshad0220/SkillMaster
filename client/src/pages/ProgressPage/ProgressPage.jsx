import React from 'react';
import { useApp } from "../../context/AppContext";
import StatCard from "../../components/ui/StatCard";

/**
 * Milestone 9 — Progress Page
 * Displays the user's learning record, performance stats, and revision queue.
 */
export default function ProgressPage() {
  const { progress, roadmapJson } = useApp();

  // Handle case where no roadmap is active
  if (!roadmapJson || !progress) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-20 text-center font-sans">
        <div className="w-16 h-16 bg-gray-100 dark:bg-navy-mid rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No progress data</h2>
        <p className="text-sm text-gray-500 dark:text-muted mb-8 max-w-sm mx-auto">
          You need an active roadmap to see your learning progress.
        </p>
      </div>
    );
  }

  // Helper to find day details by string ID (e.g. m1-w1-d1)
  const findDay = (id) => {
    if (!id) return null;
    
    // Check if ID is composite (m1-w1-d1)
    if (typeof id === 'string' && id.includes('-')) {
      const parts = id.split("-");
      if (parts.length < 3) return null;
      
      const mNum = parseInt(parts[0].replace("m", ""));
      const wNum = parseInt(parts[1].replace("w", ""));
      const dNum = parseInt(parts[2].replace("d", ""));
      
      const mod = roadmapJson.modules.find(m => m.moduleNumber === mNum);
      const week = mod?.weeks.find(w => w.weekNumber === wNum);
      return week?.days.find(d => d.dayNumber === dNum);
    }

    // Fallback for legacy number IDs
    const allDays = roadmapJson.modules.flatMap(m => m.weeks.flatMap(w => w.days));
    return allDays.find(d => d.dayNumber === parseInt(id));
  };

  // Derived Statistics
  const completedCount = progress.completedTasks?.length || 0;
  const modulesCompleted = Math.max(0, progress.currentModule - 1);
  const totalModules = roadmapJson.modules.length;
  
  // Latest Result Logic: Most recent performance (exam or session)
  let latestResultText = "Passed";
  let latestResultColor = "text-pass";
  
  if (progress.examScores?.length > 0) {
    const lastExam = progress.examScores[progress.examScores.length - 1];
    const score = typeof lastExam === 'object' ? lastExam.score : lastExam;
    latestResultText = score >= 80 ? "Passed" : "Needs Revision";
    latestResultColor = score >= 80 ? "text-pass" : "text-warn";
  }

  const weakTopics = progress.weakTopics || [];

  // Learning Summary Calculations
  const lessonsCompleted = progress.completedTasks?.filter(id => findDay(id)?.type === "Learning").length || 0;
  const revisionsCompleted = progress.completedTasks?.filter(id => findDay(id)?.type === "Revision").length || 0;
  const examsAttempted = progress.examScores?.length || 0;
  const examsPassed = progress.examScores?.filter(s => (typeof s === 'object' ? s.score : s) >= 80).length || 0;

  const summaryRows = [
    { label: "Lessons Completed", value: lessonsCompleted },
    { label: "Revision Sessions", value: revisionsCompleted },
    { label: "Exams Attempted", value: examsAttempted },
    { label: "Exams Passed", value: examsPassed },
  ];

  // Recent Outcomes Logic
  const lastTaskDayId = progress.completedTasks?.length > 0 ? progress.completedTasks[progress.completedTasks.length - 1] : null;
  const lastTask = findDay(lastTaskDayId);
  
  const lastExamObj = progress.examScores?.length > 0 ? progress.examScores[progress.examScores.length - 1] : null;
  const lastExamScore = typeof lastExamObj === 'object' ? lastExamObj?.score : lastExamObj;

  const outcomeRows = [
    { 
      label: "Last Completed", 
      value: lastTask ? lastTask.title : "None yet" 
    },
    { 
      label: "Latest Session", 
      value: lastTask ? "PASSED" : "N/A", 
      statusColor: lastTask ? "text-pass" : "text-muted" 
    },
    { 
      label: "Latest Exam", 
      value: lastExamScore ? `${lastExamScore}%` : "N/A",
      extra: lastExamScore ? (lastExamScore >= 80 ? "PASSED" : "REVISION REQUIRED") : null,
      statusColor: lastExamScore ? (lastExamScore >= 80 ? "text-pass" : "text-warn") : "text-muted"
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
        <p className="text-sm text-gray-500 dark:text-muted mt-1">
          Your learning record, performance, and growth.
        </p>
      </div>

      {/* Overview Section */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[10px] font-bold text-accent-dk dark:text-accent tracking-[0.12em] uppercase">Overview</span>
          <div className="h-[1px] flex-grow bg-gray-100 dark:bg-divider"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="COMPLETED SESSIONS" value={completedCount} />
          <StatCard 
            label="MODULES COMPLETED" 
            value={
              <span className="flex items-baseline gap-1">
                {modulesCompleted}
                <span className="text-sm font-medium text-gray-400 dark:text-muted">/ {totalModules}</span>
              </span>
            } 
          />
          <StatCard 
            label="LATEST RESULT" 
            value={<span className={latestResultColor}>{latestResultText}</span>} 
          />
          <StatCard label="REVISION TOPICS" value={weakTopics.length} />
        </div>
      </section>

      {/* Learning Record Section */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[10px] font-bold text-accent-dk dark:text-accent tracking-[0.12em] uppercase">Learning Record</span>
          <div className="h-[1px] flex-grow bg-gray-100 dark:bg-divider"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Learning Summary Panel */}
          <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-divider bg-gray-50/50 dark:bg-navy/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Learning Summary</h3>
            </div>
            <div className="px-5 divide-y divide-gray-100 dark:divide-divider">
              {summaryRows.map((row, i) => (
                <div key={i} className="flex justify-between items-center py-3.5">
                  <span className="text-sm text-gray-500 dark:text-slate">{row.label}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Outcomes Panel */}
          <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-divider bg-gray-50/50 dark:bg-navy/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Outcomes</h3>
            </div>
            <div className="px-5 divide-y divide-gray-100 dark:divide-divider">
              {outcomeRows.map((row, i) => (
                <div key={i} className="flex justify-between items-center py-3.5">
                  <span className="text-sm text-gray-500 dark:text-slate">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${row.statusColor || 'text-gray-900 dark:text-white'}`}>
                      {row.value}
                    </span>
                    {row.extra && (
                      <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase ${
                        row.extra === "PASSED" ? 'bg-pass/10 text-pass border-pass/20' : 'bg-warn/10 text-warn border-warn/20'
                      }`}>
                        {row.extra}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Revision Queue Section */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[10px] font-bold text-accent-dk dark:text-accent tracking-[0.12em] uppercase">Revision Queue</span>
          <div className="h-[1px] flex-grow bg-gray-100 dark:bg-divider"></div>
        </div>
        <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light rounded-xl overflow-hidden shadow-sm">
          {weakTopics.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-divider">
              {weakTopics.map((topic, i) => (
                <div key={topic} className="flex items-center p-5 gap-4 group hover:bg-gray-50 dark:hover:bg-navy/20 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-dk dark:bg-accent flex-shrink-0" />
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{topic}</p>
                    <p className="text-[11px] text-gray-400 dark:text-muted">Review Required for Mastery</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-gray-400 dark:text-muted italic">Great job! Your revision queue is currently empty.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

