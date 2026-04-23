import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { advanceProgress } from '../../api/progress.api';
import { useApp } from '../../context/AppContext';

/**
 * Renders pass/fail result of a weekly exam.
 * Props:
 *   result     - { score, passed, feedback, weakTopics, nextAction }
 *   dayId      - string
 *   roadmapId  - string
 */
export default function ExamResult({ result, dayId, roadmapId }) {
  const navigate = useNavigate();
  const { refreshProgress } = useApp();
  const [advancing, setAdvancing] = useState(false);

  const handleContinue = async () => {
    setAdvancing(true);
    if (result.passed) {
      // Pass: advance to next week then navigate
      try {
        await advanceProgress(roadmapId, dayId, 'completed');
        await refreshProgress();
      } catch (err) {
        console.error('Advance failed:', err);
        // Non-fatal — still navigate
      }
    }
    // Fail: backend already set Saturday, just navigate
    navigate('/learn');
  };

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="bg-white dark:bg-navy-mid
                      border border-gray-200 dark:border-navy-light
                      rounded-2xl p-10 shadow-xl text-center relative overflow-hidden">
        {/* Decorative top accent */}
        <div className={`absolute top-0 left-0 w-full h-2 ${result.passed ? 'bg-pass' : 'bg-fail'}`} />

        {/* Success/Fail Icon */}
        <div className={`w-20 h-20 rounded-full mx-auto mb-6
                         flex items-center justify-center
          ${result.passed
            ? 'bg-pass/10 border-2 border-pass shadow-inner'
            : 'bg-fail/10 border-2 border-fail shadow-inner'}`}>
          {result.passed ? (
            <svg className="w-10 h-10 text-pass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-fail" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <p className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
          {result.score}%
        </p>
        <p className={`text-lg font-bold uppercase tracking-widest ${result.passed ? 'text-pass' : 'text-fail'}`}>
          {result.passed ? 'Passed' : 'Needs Revision'}
        </p>
        <p className="text-sm text-gray-500 dark:text-muted mt-5 mb-8 leading-relaxed px-2">
          {result.passed
            ? 'Congratulations! You\'ve mastered this week\'s content and are ready to advance.'
            : 'Review the topics below and take the exam again after your revision session.'}
        </p>

        {/* Weak topics — only on failure */}
        {!result.passed && result.weakTopics?.length > 0 && (
          <div className="text-left bg-gray-50 dark:bg-navy rounded-xl p-5 mb-8
                          border border-gray-200 dark:border-divider shadow-inner">
            <p className="text-[10px] font-bold text-fail uppercase tracking-widest mb-3">
              Topics to Review
            </p>
            <ul className="space-y-2.5">
              {result.weakTopics.map((topic, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[13px] text-gray-700 dark:text-slate">
                  <div className="w-1.5 h-1.5 rounded-full bg-fail flex-shrink-0" />
                  <span className="truncate">{topic}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          variant="primary"
          loading={advancing}
          onClick={handleContinue}
          fullWidth
          className={`h-12 border-none font-bold text-sm
            ${result.passed ? 'bg-pass hover:bg-green-600' : 'bg-fail hover:bg-red-600'}`}
        >
          {result.passed ? 'Continue to Next Week' : 'Back to Revision'}
        </Button>
      </div>
    </div>
  );
}
