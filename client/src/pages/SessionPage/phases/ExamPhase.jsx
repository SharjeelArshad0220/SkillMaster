import { useState } from "react";
import Button from "../../../components/ui/Button";

/**
 * Weekly Exam phase with scoring and pass/fail logic.
 * Uses red theme for progress and buttons.
 */
export default function ExamPhase({ questions = [], onComplete }) {
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // Array of selected indices

  const q = questions[currentQIdx];
  const isLast = currentQIdx === questions.length - 1;
  const answeredCount = answers.filter(a => a !== undefined).length;
  const answeredAll = answeredCount === questions.length;

  const handleOptionSelect = (optIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQIdx] = optIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQIdx < questions.length - 1) {
      setCurrentQIdx(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevQuestion = () => {
    if (currentQIdx > 0) {
      setCurrentQIdx(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    // Calculate Score
    const correctCount = answers.reduce((acc, ans, idx) => 
      ans === questions[idx].correctIndex ? acc + 1 : acc, 0
    );
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 80;

    // Identify weak topics (lessons associated with wrong answers)
    const weakTopics = questions
      .filter((q, idx) => answers[idx] !== q.correctIndex)
      .map(q => q.topic || q.question.slice(0, 40) + "...");

    onComplete({ score, passed, weakTopics: [...new Set(weakTopics)] });
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Exam Header & Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Exam</h2>
          <p className="text-sm text-gray-500 dark:text-muted">Mastery threshold: 80% or higher</p>
        </div>
        <div className="w-full md:w-48 text-right">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-fail mb-1.5">
            <span>Exam Progress</span>
            <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-navy rounded-full overflow-hidden">
            <div 
              className="h-full bg-fail transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light rounded-xl p-8 md:p-10 shadow-sm relative overflow-hidden transition-all">
        {/* Exam Red Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-fail" />
        
        <p className="text-xs font-bold text-fail uppercase tracking-widest mb-6">
          QUESTION {currentQIdx + 1} OF {questions.length}
        </p>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-8 leading-snug">
          {q.question}
        </h3>

        <div className="flex flex-col gap-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleOptionSelect(i)}
              className={`flex items-center gap-4 h-14 px-5 rounded-[10px] border-[1.5px] text-sm font-medium text-left transition-all
                ${answers[currentQIdx] === i 
                  ? "border-fail bg-fail/5 text-gray-900 dark:text-white shadow-sm" 
                  : "bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate hover:border-gray-300 dark:hover:border-muted"
                }`}
            >
              <div className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center
                ${answers[currentQIdx] === i ? "border-fail" : "border-gray-300 dark:border-divider"}`}
              >
                {answers[currentQIdx] === i && (
                  <div className="w-2.5 h-2.5 rounded-full bg-fail" />
                )}
              </div>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-12 pt-8 border-t border-gray-100 dark:border-divider">
          <Button 
            variant="secondary" 
            disabled={currentQIdx === 0} 
            onClick={prevQuestion}
          >
            ← Previous
          </Button>
          
          {isLast ? (
            <Button 
              className={`text-white active:scale-[0.98] border-none px-10 transition-colors
                ${answeredAll ? 'bg-fail hover:bg-red-600' : 'bg-gray-400 dark:bg-muted cursor-not-allowed'}
              `}
              disabled={!answeredAll} 
              onClick={handleSubmit}
            >
              Submit Exam
            </Button>
          ) : (
            <Button 
              className={`text-white active:scale-[0.98] border-none px-10 transition-colors
                ${answers[currentQIdx] !== undefined ? 'bg-fail hover:bg-red-600' : 'bg-gray-400 dark:bg-muted cursor-not-allowed'}
              `}
              disabled={answers[currentQIdx] === undefined} 
              onClick={nextQuestion}
            >
              Next Question →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
