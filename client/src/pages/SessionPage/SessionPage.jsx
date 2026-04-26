import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getSession } from '../../api/session.api';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import LessonPhase from './phases/LessonPhase';
import TaskPhase from './phases/TaskPhase';
import FeedbackPhase from './phases/FeedbackPhase';
import ExamPhase from './phases/ExamPhase';
import ExamResult from './ExamResult';

const PHASES = {
  LOADING:  'loading',
  LESSON:   'lesson',
  TASK:     'task',
  FEEDBACK: 'feedback',
  EXAM:     'exam',
  RESULT:   'result',
  ERROR:    'error',
};

export default function SessionPage() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const { roadmapId } = useApp();

  const [phase, setPhase] = useState(PHASES.LOADING);
  const [session, setSession] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);  // { feedback, outcome, score? }
  const [examResult, setExamResult] = useState(null);      // { score, passed, weakTopics, feedback }
  const [error, setError] = useState(null);

  // Load session on mount
  useEffect(() => {
    if (!dayId || !roadmapId) return;
    setPhase(PHASES.LOADING);

    getSession(dayId, roadmapId)
      .then((data) => {
        setSession(data.session);
        if (data.session.type === 'Exam') {
          setPhase(PHASES.EXAM);
        } else {
          setPhase(PHASES.LESSON);
        }
      })
      .catch((err) => {
        console.error('Failed to load session:', err);
        setError(err?.response?.data?.error || 'There was a problem loading this session.');
        setPhase(PHASES.ERROR);
      });
  }, [dayId, roadmapId]);

  // Phase transition handlers
  const handleLessonComplete = () => setPhase(PHASES.TASK);

  const handleTaskComplete = (feedbackPayload) => {
    setFeedbackData(feedbackPayload);
    setPhase(PHASES.FEEDBACK);
  };

  const handleExamComplete = (resultPayload) => {
    setExamResult(resultPayload);
    setPhase(PHASES.RESULT);
  };

  const phaseLabels = {
    [PHASES.LESSON]:   'LESSON',
    [PHASES.TASK]:     'TASK',
    [PHASES.FEEDBACK]: 'FEEDBACK',
    [PHASES.EXAM]:     'EXAM',
    [PHASES.RESULT]:   'RESULT',
  };

  // ── Full-screen loading ──────────────────────────────────────────────────
  if (phase === PHASES.LOADING) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-navy font-sans
                      flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent-dk dark:border-accent
                        border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400 dark:text-muted">Preparing your session...</p>
        <p className="text-xs text-gray-300 dark:text-muted opacity-60">
          First visit may take up to 15 seconds
        </p>
      </div>
    );
  }

  // ── Full-screen error ────────────────────────────────────────────────────
  if (phase === PHASES.ERROR) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-navy font-sans
                      flex flex-col items-center justify-center gap-4 px-5">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-fail/10
                        flex items-center justify-center">
          <svg className="w-6 h-6 text-fail" fill="none" viewBox="0 0 24 24"
               stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center max-w-[320px]">
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Session could not load
          </p>
          <p className="text-sm text-gray-400 dark:text-muted leading-relaxed">
            {error || 'There was a problem loading this session.'}
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Button variant="primary" onClick={() => navigate('/learn')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy font-sans">
      {/* Main Container */}
      <div className="max-w-[900px] mx-auto px-5 py-6">
        {/* Session header */}
        {session && (
          <div className="bg-white dark:bg-navy-mid
                          border border-gray-200 dark:border-navy-light
                          rounded-xl p-5 mb-4 flex flex-row items-center justify-between shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em]
                          text-accent-dk dark:text-accent">
              {phaseLabels[phase] || ''}
            </p>
            <p className="text-[15px] font-bold text-gray-900 dark:text-white truncate px-3 hidden sm:block max-w-[65%]">
              {session.title || session.content?.parts?.[0]?.partTitle || 'Session'}
            </p>
            <Badge variant={session.type?.toLowerCase()}>{session.type}</Badge>
          </div>
        )}

        {phase === PHASES.LESSON && session && (
          <LessonPhase
            parts={session.content.parts}
            onComplete={handleLessonComplete}
          />
        )}

        {phase === PHASES.TASK && session && (
          <TaskPhase
            task={session.content.task}
            dayId={dayId}
            roadmapId={roadmapId}
            onComplete={handleTaskComplete}
          />
        )}

        {phase === PHASES.FEEDBACK && feedbackData && (
          <FeedbackPhase
            feedback={feedbackData.feedback}
            outcome={feedbackData.outcome}
            dayId={dayId}
            resources={feedbackData?.resources}
            roadmapId={roadmapId}
          />
        )}

        {phase === PHASES.EXAM && session && (
          <ExamPhase
            questions={session.content.examQuestions}
            dayId={dayId}
            roadmapId={roadmapId}
            onComplete={handleExamComplete}
          />
        )}

        {phase === PHASES.RESULT && examResult && (
          <ExamResult
            result={examResult}
            dayId={dayId}
            roadmapId={roadmapId}
          />
        )}
      </div>
    </div>
  );
}
