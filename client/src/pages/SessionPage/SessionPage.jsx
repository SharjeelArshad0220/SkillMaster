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
        setError('Failed to load session. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy font-sans">
      {/* Main Container */}
      <div className="max-w-[760px] mx-auto px-5 py-8">
        {/* Session header resolved in the card limit */}
        {session && phase !== PHASES.LOADING && phase !== PHASES.ERROR && (
          <div className="bg-white dark:bg-navy-mid
                          border border-gray-200 dark:border-navy-light
                          rounded-xl p-5 mb-8 flex flex-row items-center justify-between shadow-sm">
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

        {phase === PHASES.LOADING && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-400 dark:text-muted">
              Preparing your session...
            </p>
          </div>
        )}

        {phase === PHASES.ERROR && (
          <div className="text-center py-24">
            <p className="text-sm text-fail mb-4">{error}</p>
            <Button variant="primary" onClick={() => navigate('/learn')}>
              Back to Dashboard
            </Button>
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
