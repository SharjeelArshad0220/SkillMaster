import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getSession } from '../../api/session.api';

export default function SessionDetailPage() {
  const { dayId } = useParams();
  const { roadmapId } = useApp();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dayId || !roadmapId) return;
    getSession(dayId, roadmapId)
      .then(data => setSession(data.session))
      .finally(() => setLoading(false));
  }, [dayId, roadmapId]);

  if (loading) return <div className="text-center py-24 text-gray-400 dark:text-muted font-sans">Loading...</div>;
  if (!session) return (
    <div className="max-w-[760px] mx-auto px-5 py-24 text-center font-sans">
      <button 
        onClick={() => navigate('/history')} 
        className="text-xs font-semibold text-accent-dk dark:text-accent hover:underline mb-4 inline-block"
      >
        ← Back to History
      </button>
      <p className="text-fail">Session not found.</p>
    </div>
  );

  return (
    <div className="max-w-[760px] mx-auto px-5 py-8 font-sans">
      <button 
        onClick={() => navigate('/history')} 
        className="text-xs font-semibold text-accent-dk dark:text-accent hover:underline mb-6 inline-flex items-center gap-1"
      >
        ← Back to History
      </button>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{session.dayId}</h1>
      <p className="text-sm text-gray-400 dark:text-muted mb-6">{session.type} — {session.status}</p>

      {session.type !== 'Exam' && session.content?.parts?.map((part, i) => (
        <div key={i} className="mb-6 p-5 rounded-xl bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light shadow-sm">
          <p className="text-[11px] font-bold uppercase text-accent-dk dark:text-accent mb-3">{part.partTitle}</p>
          {part.cards.map((card, j) => (
            <p key={j} className="text-sm text-gray-600 dark:text-slate leading-relaxed mb-3">{card.content}</p>
          ))}
        </div>
      ))}

      {session.type === 'Exam' && session.userSubmission && (
        <div className="mb-6 p-5 rounded-xl bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light shadow-sm">
          <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
            Score: {session.userSubmission.score}% — {session.userSubmission.passed ? 'Passed' : 'Failed'}
          </p>
          {session.userSubmission.weakTopics?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase text-fail mb-2">Weak Topics</p>
              {session.userSubmission.weakTopics.map((t, i) => <p key={i} className="text-sm text-gray-600 dark:text-slate">• {t}</p>)}
            </div>
          )}
        </div>
      )}

      {session.aiFeedback && (
        <div className="p-5 rounded-xl bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light shadow-sm">
          <p className="text-[11px] font-bold uppercase text-accent-dk dark:text-accent mb-3">AI Feedback</p>
          <p className="text-sm text-gray-600 dark:text-slate leading-relaxed">{session.aiFeedback}</p>
        </div>
      )}
    </div>
  );
}