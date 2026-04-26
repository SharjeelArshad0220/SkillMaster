import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from "../../context/AppContext";
import { getStats } from "../../api/progress.api";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";

/**
 * Milestone F2 — Progress Page
 * Displays the user's learning record, performance stats, and revision queue.
 */
export default function ProgressPage() {
  const { roadmapId, roadmapJson, progress, roadmapLoading } = useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch stats from server whenever roadmapId becomes available
  useEffect(() => {
    if (!roadmapId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getStats(roadmapId)
      .then(data => setStats(data))
      .catch(err => {
        const message = err?.response?.data?.error || 'Failed to load progress data.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [roadmapId]);

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (roadmapLoading || loading) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
        <p className="text-sm text-gray-500 dark:text-muted mt-1 mb-8">
          Your learning record, performance, and growth.
        </p>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-dk dark:border-accent
                          border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400 dark:text-muted">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // ── NO ROADMAP ────────────────────────────────────────────────────────────
  if (!roadmapId) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
        <p className="text-sm text-gray-500 dark:text-muted mt-1 mb-8">
          Your learning record, performance, and growth.
        </p>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Nothing to show yet
            </h3>
            <p className="text-sm text-gray-400 dark:text-muted max-w-[280px]">
              Complete your setup and start learning to see your progress here.
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/setup')}>
            Create My Roadmap
          </Button>
        </div>
      </div>
    );
  }

  // ── FETCH ERROR ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
        <div className="flex flex-col items-center justify-center py-16 gap-4 mt-8">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-fail/10
                          flex items-center justify-center">
            <svg className="w-6 h-6 text-fail" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Could not load progress
            </p>
            <p className="text-sm text-gray-400 dark:text-muted">{error}</p>
          </div>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── DATA READY ────────────────────────────────────────────────────────────
  const latestResultColor =
    stats?.latestResult === "Passed" ? "text-pass"
    : stats?.latestResult === "Failed" ? "text-fail"
    : "text-muted";

  const summaryRows = [
    { label: "Lessons Completed",  value: stats?.lessonsCompleted  ?? '—' },
    { label: "Revision Sessions",  value: stats?.revisionSessions  ?? '—' },
    { label: "Exams Attempted",    value: stats?.examsAttempted    ?? '—' },
    { label: "Exams Passed",       value: stats?.examsPassed       ?? '—' },
  ];

  const outcomeRows = [
    {
      label: "Last Completed",
      value: stats?.lastCompletedTitle ?? '—',
    },
    {
      label: "Latest Session",
      value: stats?.lastSessionOutcome?.toUpperCase() ?? '—',
      statusColor: stats?.lastSessionOutcome === "completed" ? "text-pass" : "text-muted",
    },
    {
      label: "Latest Exam",
      value: stats?.latestExamScore != null
        ? `${stats.latestExamScore}% — ${stats.latestExamPassed ? 'Passed' : 'Needs Revision'}`
        : '—',
      statusColor: stats?.latestExamScore != null
        ? (stats.latestExamPassed ? "text-pass" : "text-warn")
        : "text-muted",
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
          <StatCard label="COMPLETED SESSIONS" value={stats?.completedSessions ?? '—'} />
          <StatCard
            label="MODULES COMPLETED"
            value={
              <span className="flex items-baseline gap-1">
                {stats?.modulesCompleted?.split('/')?.[0] ?? '0'}
                <span className="text-sm font-medium text-gray-400 dark:text-muted">/ {stats?.modulesCompleted?.split('/')?.[1] ?? '0'}</span>
              </span>
            }
          />
          <StatCard
            label="LATEST RESULT"
            value={<span className={latestResultColor}>{stats?.latestResult ?? 'N/A'}</span>}
          />
          <StatCard label="REVISION TOPICS" value={stats?.revisionTopicsCount ?? '—'} />
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
          {stats.revisionQueue?.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-divider">
              {stats.revisionQueue.map((topic, i) => (
                <div key={i} className="flex items-center p-5 gap-4 group hover:bg-gray-50 dark:hover:bg-navy/20 transition-colors">
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
