import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Button from '../../../components/ui/Button';
import { advanceProgress } from '../../../api/progress.api';
import { useApp } from '../../../context/AppContext';

/**
 * Displays AI feedback after task submission.
 * Props:
 *   feedback   - string from backend
 *   outcome    - "positive" | "needs_improvement"
 *   dayId      - string
 *   roadmapId  - string
 */
export default function FeedbackPhase({ feedback, outcome, dayId, roadmapId, resources }) {
  const navigate = useNavigate();
  const { refreshProgress } = useApp();
  const [advancing, setAdvancing] = useState(false);

  const handleContinue = async () => {
    setAdvancing(true);
    try {
      await advanceProgress(roadmapId, dayId, 'completed');
      await refreshProgress();
    } catch (err) {
      console.error('Failed to advance progress:', err);
      // Non-fatal — still navigate
    } finally {
      navigate('/learn');
    }
  };

  const isPositive = outcome === 'positive';

  // Split feedback into paragraphs
  const paragraphs = feedback ? feedback.split('\n\n').filter(Boolean) : [];

  return (
    <div className="bg-white dark:bg-navy-mid
                    border border-gray-200 dark:border-navy-light
                    rounded-xl p-8 shadow-sm animate-fade-in">
      {/* Outcome indicator */}
      <div className={`flex items-center gap-4 p-5 rounded-xl mb-8 border transition-all
        ${isPositive
          ? 'bg-pass/10 border-pass/30 dark:border-pass/20'
          : 'bg-warn/10 border-warn/30 dark:border-warn/20'
        }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${isPositive ? 'bg-pass text-white' : 'bg-warn text-white'}`}>
          {isPositive ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div>
          <h4 className={`text-base font-bold ${isPositive ? 'text-pass' : 'text-warn'}`}>
            {isPositive ? 'Excellent Progress!' : 'Keep Working on It'}
          </h4>
          <p className={`text-sm opacity-80 ${isPositive ? 'text-pass' : 'text-warn'}`}>
            {isPositive
              ? 'Your response demonstrates a strong understanding of today\'s lesson.'
              : 'We\'ve identified some areas that need more attention. Review the feedback below.'}
          </p>
        </div>
      </div>

      {/* AI Feedback Body */}
      <p className="text-[11px] font-bold uppercase tracking-[0.06em]
                    text-accent-dk dark:text-accent mb-4">AI FEEDBACK</p>
      <div className="prose prose-sm max-w-none mb-10
                      prose-p:text-gray-600 prose-p:dark:text-slate prose-p:leading-[1.7] prose-p:my-2
                      prose-code:text-gray-900 prose-code:dark:text-accent
                      prose-code:bg-gray-100 prose-code:dark:bg-navy
                      prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]
                      prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                      prose-strong:font-semibold prose-strong:text-gray-900 prose-strong:dark:text-white
                      prose-ul:text-gray-600 prose-ul:dark:text-slate
                      prose-li:my-0.5">
        <ReactMarkdown>{feedback}</ReactMarkdown>
      </div>
      {resources && (
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-divider">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-3">
            EXPLORE FURTHER
          </p>
          <div className="
      prose prose-sm max-w-none
      prose-a:text-accent-dk prose-a:dark:text-accent prose-a:no-underline 
      prose-a:hover:underline prose-p:text-gray-500 prose-p:dark:text-muted
      prose-p:text-sm prose-p:leading-relaxed
    ">
            <ReactMarkdown>{resources}</ReactMarkdown>
          </div>
        </div>
      )}
      <Button variant="primary" loading={advancing} onClick={handleContinue} fullWidth>
        Continue to Next Session
      </Button>
    </div>
  );
}
