import { useState } from "react";
import Button from "../../../components/ui/Button";
import { getAIFeedback } from "../../../api/feedback.api";

/**
 * Handles both text-based tasks and dynamic MCQ tasks.
 */
export default function TaskPhase({ task, dayId, roadmapId, onComplete }) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // MCQ State (Paginated)
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState([]); // Store selected indices

  const isMcq = task.type === "mcq";
  const questions = task.questions || [];

  // Text Task Submission
  const handleTextSubmit = async () => {
    if (answer.trim().length < 20) return;
    setLoading(true);
    setError(null);
    try {
      const feedback = await getAIFeedback(roadmapId, dayId, answer);
      onComplete(feedback);
    } catch (err) {
      setError("Failed to get feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // MCQ Logic
  const handleOptionSelect = (optIndex) => {
    const newAnswers = [...mcqAnswers];
    newAnswers[currentQIdx] = optIndex;
    setMcqAnswers(newAnswers);
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

  const handleMcqSubmit = () => {
    const correctCount = mcqAnswers.reduce((acc, ans, idx) => 
      ans === questions[idx].correctIndex ? acc + 1 : acc, 0
    );
    const score = (correctCount / questions.length) * 100;
    
    // Simulate feedback for MCQ task
    const feedback = {
      feedback: `You completed the theory task with a score of ${Math.round(score)}%. ${
        score >= 80 
          ? "Excellent work! Your answers demonstrate a solid grasp of the core concepts covered in today's lesson." 
          : "You've made a good start, but some concepts still need work. We'll add these topics to your revision queue for later review."
      }`,
      outcome: score >= 80 ? "positive" : "needs_improvement"
    };
    onComplete(feedback);
  };

  // --- MCQ UI ---
  if (isMcq) {
    const q = questions[currentQIdx];
    const isLast = currentQIdx === questions.length - 1;
    const answeredCount = mcqAnswers.filter(a => a !== undefined).length;
    const answeredAll = answeredCount === questions.length;

    return (
      <div className="animate-fade-in space-y-8">
        {/* MCQ Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
            <span>Question {currentQIdx + 1} of {questions.length}</span>
            <span>{answeredCount} of {questions.length} Answered</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-navy rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-dk dark:bg-accent transition-all duration-300"
              style={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }} 
            />
          </div>
        </div>

        <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light rounded-xl p-8 shadow-sm">
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
                  ${mcqAnswers[currentQIdx] === i 
                    ? "bg-sky-50 dark:bg-accent/10 border-accent-dk dark:border-accent text-gray-900 dark:text-white" 
                    : "bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate"
                  }`}
              >
                 <div className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center
                  ${mcqAnswers[currentQIdx] === i ? "border-accent-dk dark:border-accent" : "border-gray-300 dark:border-divider"}`}
                >
                  {mcqAnswers[currentQIdx] === i && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-dk dark:bg-accent" />
                  )}
                </div>
                {opt}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-10">
            <Button variant="secondary" disabled={currentQIdx === 0} onClick={prevQuestion}>
              ← Previous
            </Button>
            {isLast ? (
              <Button variant="primary" disabled={!answeredAll} onClick={handleMcqSubmit}>
                Submit Answers →
              </Button>
            ) : (
              <Button variant="primary" disabled={mcqAnswers[currentQIdx] === undefined} onClick={nextQuestion}>
                Next Question →
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- TEXT TASK UI ---
  return (
    <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light rounded-xl p-8 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-accent-dk dark:bg-accent" />
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-accent-dk dark:text-accent">
          Practical Task
        </p>
      </div>

      <p className="text-[17px] font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">
        {task.description}
      </p>

      <div className="border-t border-gray-100 dark:border-divider pt-8 mt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-accent-dk dark:text-accent mb-3">
          YOUR ANSWER
        </p>
        <textarea
          className="w-full h-[220px] px-4 py-4 rounded-xl text-sm font-sans
                     bg-gray-50/50 dark:bg-navy
                     border border-gray-300 dark:border-divider
                     text-gray-900 dark:text-white
                     placeholder:text-gray-300 dark:placeholder:text-muted
                     focus:border-accent-dk dark:focus:border-accent
                     focus:outline-none focus:ring-0 resize-none transition-all shadow-inner"
          placeholder="Type your solution or explanation here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <div className="flex justify-between items-center mt-3 mb-8">
          {error && <p className="text-xs text-fail font-medium">{error}</p>}
          <span className="ml-auto text-xs text-gray-400 dark:text-muted">
            {answer.length} characters (min 20)
          </span>
        </div>

        <Button 
          variant="primary" 
          loading={loading} 
          disabled={answer.trim().length < 20} 
          onClick={handleTextSubmit}
          fullWidth
        >
          {loading ? "Analyzing Submission..." : "Submit Task for AI Review"}
        </Button>
      </div>
    </div>
  );
}
