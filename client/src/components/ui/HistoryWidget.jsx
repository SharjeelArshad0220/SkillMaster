import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionHistory } from '../../api/session.api';

const TYPE_DOT = {
  Learning: 'bg-accent-dk dark:bg-accent',
  Revision: 'bg-warn',
  Exam: 'bg-fail',
};

const PREVIEW_COUNT = 4;

/**
 * Recent Sessions widget for LearnPage.
 * Shows PREVIEW_COUNT rows by default. "View All" redirects the user to the
 * standalone /history page. Each row navigates to /history/:dayId.
 *
 * Props:
 *   roadmapId - string, required. Parent (LearnPage) owns fetching this
 *               from useApp() and passes it down.
 */
export default function HistoryWidget({ roadmapId }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roadmapId) return;
    getSessionHistory(roadmapId)
      .then(data => setHistory(data.history))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [roadmapId]);

  if (!roadmapId || loading) return null; // silent — secondary widget
  if (history.length === 0) return null;  // nothing to show yet

  const visible = history.slice(0, PREVIEW_COUNT);

  return (
    <div className="pb-10 md:pb-0">
      <div className="flex items-center justify-between mb-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                      text-accent-dk dark:text-accent">
          RECENT SESSIONS
        </p>
        {history.length > PREVIEW_COUNT && (
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-semibold text-accent-dk dark:text-accent hover:underline"
          >
            View All ({history.length})
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-navy-mid
                      border border-gray-200 dark:border-navy-light
                      rounded-xl overflow-hidden shadow-sm
                      divide-y divide-gray-100 dark:divide-divider">
        {visible.map((s) => (
          <button
            key={s.dayId}
            onClick={() => navigate(`/history/${s.dayId}`)}
            className="w-full flex items-center justify-between px-5 h-[52px]
                       hover:bg-gray-50 dark:hover:bg-navy-light/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[s.type] || 'bg-gray-300'}`} />
              <span className="text-sm font-semibold text-gray-700 dark:text-slate truncate">
                {s.type} — {s.dayId}
              </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-muted flex-shrink-0 ml-3">
              {s.type === 'Exam' && s.score !== null
                ? `${s.score}% ${s.passed ? '· Passed' : '· Failed'}`
                : (s.completedAt ? new Date(s.completedAt).toLocaleDateString() : 'In progress')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
