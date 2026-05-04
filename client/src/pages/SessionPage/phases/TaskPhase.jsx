import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Button from '../../../components/ui/Button';
import { submitTask } from '../../../api/session.api';

const extractErrorMessage = (err) => {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === 'ERR_NETWORK') return 'Cannot connect to server. Check your connection.';
  return 'Submission failed. Please try again.';
};

/**
 * Handles both text-based tasks and MCQ tasks.
 * Props:
 *   task       - { type: "text"|"mcq", description?, questions? }
 *   dayId      - string
 *   roadmapId  - string
 *   onComplete - called with { feedback, outcome, score?, passed? }
 */
export default function TaskPhase({ task, dayId, roadmapId, onComplete }) {
  const [textAnswer, setTextAnswer] = useState('');
  const [mcqAnswers, setMcqAnswers] = useState({});  // { questionIndex: selectedIndex }
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Text task submit
  const handleTextSubmit = async () => {
    if (textAnswer.trim().length < 20) {
      setError('Answer must be at least 20 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await submitTask(dayId, {
        roadmapId,
        type: 'text',
        taskAnswer: textAnswer,
        mcqAnswers: null,
      });
      onComplete({
        feedback: result.feedback,
        outcome: result.outcome,
        resources: result.resources,
      });
    } catch (err) {
      console.error('Text submission failed:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // MCQ task submit — called after all questions answered
  const handleMcqSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build array format backend expects
      const answersArray = task.questions.map((_, idx) => ({
        questionIndex: idx,
        selectedIndex: mcqAnswers[idx] ?? -1,
      }));
      const result = await submitTask(dayId, {
        roadmapId,
        type: 'mcq',
        taskAnswer: null,
        mcqAnswers: answersArray,
      });
      onComplete({
        feedback: result.feedback,
        outcome: result.outcome,
        score: result.score,
        passed: result.passed,
        resources: result.resources,
      });
    } catch (err) {
      console.error('MCQ submission failed:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // --- NO TASK CASE (e.g. Revision Days) ---
  if (!task) {
    return (
      <div className="bg-white dark:bg-navy-mid
                      border border-gray-200 dark:border-navy-light
                      rounded-xl p-8 shadow-sm animate-fade-in text-center">
        <div className="w-16 h-16 bg-pass/10 dark:bg-pass/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-pass/20">
          <svg className="w-8 h-8 text-pass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Session Completed!
        </h3>
        <p className="text-[15px] text-gray-600 dark:text-slate leading-[1.65] mb-8">
          You've successfully finished this topic's learning material.
        </p>
        <Button 
          variant="primary" 
          onClick={() => onComplete({ feedback: 'You have completed the session successfully.', outcome: 'positive' })}
        >
          Finish Session
        </Button>
      </div>
    );
  }

  // --- TEXT TASK UI ---
  if (task.type === 'text') {
    return (
      <div className="bg-white dark:bg-navy-mid
                      border border-gray-200 dark:border-navy-light
                      rounded-xl p-8 shadow-sm animate-fade-in">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em]
                      text-accent-dk dark:text-accent mb-3">TASK</p>
        <div className="prose prose-sm max-w-none text-gray-700 dark:text-slate leading-[1.65] mb-6
                        prose-code:text-gray-900 prose-code:dark:text-accent
                        prose-code:bg-gray-100 prose-code:dark:bg-navy
                        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]
                        prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                        prose-strong:font-semibold">
          <ReactMarkdown>{task.description}</ReactMarkdown>
        </div>
        <div className="border-t border-gray-100 dark:border-divider pt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em]
                        text-accent-dk dark:text-accent mb-3">YOUR ANSWER</p>
          <textarea
            className="w-full h-[200px] px-4 py-3 rounded-lg text-sm font-sans
                       bg-white dark:bg-navy
                       border border-gray-300 dark:border-divider
                       text-gray-900 dark:text-white
                       placeholder:text-gray-300 dark:placeholder:text-muted
                       focus:border-accent-dk dark:focus:border-accent
                       focus:outline-none focus:ring-0 resize-none"
            placeholder="Write your answer here. Minimum 20 characters."
            value={textAnswer}
            onChange={(e) => {
              setTextAnswer(e.target.value);
              if (error) setError(null);
            }}
          />
          <div className="flex justify-between items-center mt-2 mb-6">
            <span />
            <span className={`text-xs ${textAnswer.length < 20
              ? 'text-fail'
              : 'text-gray-400 dark:text-muted'}`}>
              {textAnswer.length} / 1000
            </span>
          </div>
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg
                            bg-red-50 dark:bg-fail/10
                            border border-red-200 dark:border-fail/30
                            mb-4">
              <svg className="w-4 h-4 text-fail flex-shrink-0 mt-0.5" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                         1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464
                         0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-fail leading-snug">{error}</p>
            </div>
          )}
          <Button
            variant="primary"
            loading={loading}
            disabled={textAnswer.trim().length < 20}
            onClick={handleTextSubmit}
            fullWidth
          >
            {loading ? 'Getting Feedback...' : 'Submit Task'}
          </Button>
        </div>
      </div>
    );
  }

  // --- MCQ TASK UI ---
  if (task.type === 'mcq') {
    const question = task.questions[currentQ];
    const allAnswered = Object.keys(mcqAnswers).length === task.questions.length;

    return (
      <div className="bg-white dark:bg-navy-mid
                      border border-gray-200 dark:border-navy-light
                      rounded-xl p-8 shadow-sm animate-fade-in">
        <div className="flex justify-between text-xs text-gray-400 dark:text-muted mb-6">
          <span>Question {currentQ + 1} of {task.questions.length}</span>
          <span>{Object.keys(mcqAnswers).length} answered</span>
        </div>

        <div className="text-lg font-semibold text-gray-900 dark:text-white mb-6
                        prose prose-sm max-w-none
                        prose-code:text-gray-900 prose-code:dark:text-accent
                        prose-code:bg-gray-100 prose-code:dark:bg-navy
                        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]
                        prose-code:font-mono prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown>{question.question}</ReactMarkdown>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setMcqAnswers(prev => ({ ...prev, [currentQ]: i }));
                if (error) setError(null);
              }}
              className={`flex items-center gap-4 h-14 px-5 rounded-[10px]
                          border-[1.5px] text-sm font-medium text-left transition-all
                ${mcqAnswers[currentQ] === i
                  ? 'bg-sky-50 dark:bg-accent/10 border-accent-dk dark:border-accent text-gray-900 dark:text-white'
                  : 'bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate'
                }`}
            >
              <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                {opt}
              </ReactMarkdown>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {currentQ > 0 && (
            <Button variant="secondary" onClick={() => setCurrentQ(q => q - 1)}>
              ← Previous
            </Button>
          )}
          {currentQ < task.questions.length - 1 ? (
            <Button
              variant="primary"
              disabled={mcqAnswers[currentQ] === undefined}
              onClick={() => setCurrentQ(q => q + 1)}
            >
              Next Question →
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={loading}
              disabled={!allAnswered}
              onClick={handleMcqSubmit}
            >
              {loading ? 'Submitting...' : 'Submit All Answers'}
            </Button>
          )}
        </div>
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg
                          bg-red-50 dark:bg-fail/10
                          border border-red-200 dark:border-fail/30
                          mt-4">
            <svg className="w-4 h-4 text-fail flex-shrink-0 mt-0.5" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                       1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464
                       0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-fail leading-snug">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
