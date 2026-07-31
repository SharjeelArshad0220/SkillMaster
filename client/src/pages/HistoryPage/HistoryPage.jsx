import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getSessionHistory } from '../../api/session.api';

const TYPE_BADGE = {
  Learning: 'bg-sky-50 text-sky-700 dark:bg-accent/10 dark:text-accent',
  Revision: 'bg-amber-50 text-amber-700 dark:bg-warn/10 dark:text-warn',
  Exam: 'bg-red-50 text-red-700 dark:bg-fail/10 dark:text-fail',
};

export default function HistoryPage() {
  const { roadmapId } = useApp();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roadmapId) { setLoading(false); return; }
    getSessionHistory(roadmapId)
      .then(data => setHistory(data.history))
      .catch(() => setError('Failed to load session history.'))
      .finally(() => setLoading(false));
  }, [roadmapId]);

  if (loading) {
    return <div className="text-center py-24 text-gray-400 dark:text-muted">Loading history...</div>;
  }
  if (error) {
    return <div className="text-center py-24 text-fail">{error}</div>;
  }
  if (history.length === 0) {
    return (
      <div className="max-w-[760px] mx-auto px-5 py-24 text-center font-sans">
        <button 
          onClick={() => navigate('/learn')} 
          className="text-xs font-semibold text-accent-dk dark:text-accent hover:underline mb-4 inline-block"
        >
          ← Back to Dashboard
        </button>
        <p className="text-gray-400 dark:text-muted">No sessions completed yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto px-5 py-8 font-sans">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/learn')} 
            className="text-xs font-semibold text-accent-dk dark:text-accent hover:underline mb-2 inline-flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Session History</h1>
          <p className="text-xs text-gray-500 dark:text-muted mt-0.5">
            Complete list of your past learning, revision, and exam sessions.
          </p>
        </div>
        <span className="self-start sm:self-auto text-xs font-medium text-gray-500 dark:text-muted bg-gray-100 dark:bg-navy-mid px-3 py-1 rounded-full border border-gray-200 dark:border-navy-light">
          {history.length} {history.length === 1 ? 'Session' : 'Sessions'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {history.map((s) => (
          <button
            key={s.dayId}
            onClick={() => navigate(`/history/${s.dayId}`)}
            className="flex items-center justify-between p-4 rounded-xl
                       bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light
                       hover:border-accent-dk dark:hover:border-accent transition-colors text-left group shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${TYPE_BADGE[s.type] || ''}`}>
                  {s.type}
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate">{s.dayId}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-muted">
                {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : 'In progress'}
                {s.type === 'Exam' && s.score !== null && ` — ${s.score}% ${s.passed ? 'Passed' : 'Failed'}`}
              </p>
            </div>
            <span className="text-gray-300 dark:text-muted group-hover:text-accent-dk dark:group-hover:text-accent transition-colors">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}