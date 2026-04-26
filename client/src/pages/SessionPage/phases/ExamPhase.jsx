import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Button from '../../../components/ui/Button';
import { submitExam } from '../../../api/session.api';

/**
 * Weekly exam phase with real backend submission.
 * Props:
 *   questions  - array of { question, options[], correctIndex, topicTag }
 *   dayId      - string
 *   roadmapId  - string
 *   onComplete - called with { score, passed, feedback, weakTopics, nextAction }
 */
export default function ExamPhase({ questions = [], dayId, roadmapId, onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});   // { questionIndex: selectedIndex }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allAnswered = Object.keys(answers).length === questions.length;

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setLoading(true);
    setError(null);
    try {
      // Build array format backend expects
      const answersArray = questions.map((_, idx) => ({
        questionIndex: idx,
        selectedIndex: answers[idx] ?? -1,
      }));

      const result = await submitExam(dayId, { roadmapId, answers: answersArray });
      onComplete(result); // { score, passed, feedback, weakTopics, nextAction }
    } catch (err) {
      console.error('Exam submission failed:', err);
      setError(err?.response?.data?.error || 'Exam submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const question = questions[currentQ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Exam progress bar — red */}
      <div>
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest
                        text-fail mb-2">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-fail rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-navy-mid
                      border border-gray-200 dark:border-navy-light
                      rounded-xl p-8 md:p-10 shadow-sm relative overflow-hidden">
        {/* Red top accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-fail" />

        <div className="text-lg font-semibold text-gray-900 dark:text-white mb-8 leading-snug
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
              onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
              className={`flex items-center gap-4 h-14 px-5 rounded-[10px]
                          border-[1.5px] text-sm font-medium text-left transition-all
                ${answers[currentQ] === i
                  ? 'bg-red-50 dark:bg-fail/10 border-fail text-fail'
                  : 'bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate'
                }`}
            >
              <div className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0
                               flex items-center justify-center
                ${answers[currentQ] === i ? 'border-fail' : 'border-gray-300 dark:border-divider'}`}>
                {answers[currentQ] === i && (
                  <div className="w-2.5 h-2.5 rounded-full bg-fail" />
                )}
              </div>
              <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                {opt}
              </ReactMarkdown>
            </button>
          ))}
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-divider">
          {currentQ > 0 && (
            <Button variant="secondary" onClick={() => setCurrentQ(q => q - 1)}>
              ← Previous
            </Button>
          )}
          <div className="ml-auto">
            {currentQ < questions.length - 1 ? (
              <Button
                variant="primary"
                disabled={answers[currentQ] === undefined}
                onClick={() => setCurrentQ(q => q + 1)}
              >
                Next Question →
              </Button>
            ) : (
              <Button
                className="bg-fail text-white hover:bg-red-600 border-0"
                loading={loading}
                disabled={!allAnswered}
                onClick={handleSubmit}
              >
                {loading ? 'Submitting...' : 'Submit Exam'}
              </Button>
            )}
          </div>
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
    </div>
  );
}
