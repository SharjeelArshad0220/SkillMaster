import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../../context/AppContext';
import { getSession } from '../../api/session.api';

const PROSE_CLASSES = `
  prose prose-sm max-w-none
  prose-p:text-gray-600 prose-p:dark:text-slate prose-p:leading-relaxed prose-p:my-2
  prose-strong:text-gray-900 prose-strong:dark:text-white prose-strong:font-semibold
  prose-ul:text-gray-600 prose-ul:dark:text-slate prose-ul:my-2
  prose-ol:text-gray-600 prose-ol:dark:text-slate prose-ol:my-2
  prose-li:text-gray-600 prose-li:dark:text-slate prose-li:my-0.5
  prose-code:text-gray-900 prose-code:dark:text-accent
  prose-code:bg-gray-100 prose-code:dark:bg-navy
  prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]
  prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-gray-100 prose-pre:dark:bg-navy
  prose-pre:border prose-pre:border-gray-200 prose-pre:dark:border-divider
  prose-pre:rounded-lg prose-pre:text-[13px] prose-pre:overflow-x-auto prose-pre:my-3
  prose-pre:code:bg-transparent prose-pre:code:p-0 prose-pre:code:text-gray-900 prose-pre:code:dark:text-accent
  prose-headings:text-gray-900 prose-headings:dark:text-white
`;

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
            <div key={j} className={`mb-4 last:mb-0 ${PROSE_CLASSES}`}>
              <ReactMarkdown>{card.content}</ReactMarkdown>
            </div>
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
          <div className={PROSE_CLASSES}>
            <ReactMarkdown>{session.aiFeedback}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}