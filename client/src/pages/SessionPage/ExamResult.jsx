import Button from "../../components/ui/Button";

/**
 * Renders the pass/fail results of a weekly exam.
 */
export default function ExamResult({ result, onClose }) {
  const { score, passed, weakTopics } = result;

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light rounded-2xl p-10 shadow-xl text-center relative overflow-hidden transition-all duration-300">
        
        {/* Decorative Top Accent */}
        <div className={`absolute top-0 left-0 w-full h-2 ${passed ? "bg-pass" : "bg-fail"}`} />

        {/* Success/Fail Icon */}
        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center 
          ${passed ? "bg-pass/10 border-2 border-pass shadow-inner" : "bg-fail/10 border-2 border-fail shadow-inner"}`}
        >
          {passed ? (
            <svg className="w-10 h-10 text-pass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-fail" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
          {score}%
        </h2>
        
        <p className={`text-lg font-bold uppercase tracking-widest ${passed ? "text-pass" : "text-fail"}`}>
          {passed ? "Weekly Exam Passed!" : "Requires Revision"}
        </p>

        <p className="text-sm text-gray-500 dark:text-muted mt-5 mb-8 leading-relaxed px-2">
          {passed 
            ? "Congratulations! You've successfully mastered this week's content and are ready to advance to the next set of modules."
            : "You're almost there! Some topics still need attention before you move forward. You'll return to Saturday's revision session to reinforce these areas."}
        </p>

        {/* Weak Topics List (Only visible on failure) */}
        {!passed && weakTopics && weakTopics.length > 0 && (
          <div className="text-left bg-gray-50 dark:bg-navy rounded-xl p-5 mb-8 border border-gray-200 dark:border-divider shadow-inner">
            <p className="text-[10px] font-bold text-fail uppercase tracking-widest mb-3">Topics to Review</p>
            <ul className="space-y-2.5">
              {weakTopics.slice(0, 3).map((topic, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[13px] text-gray-700 dark:text-slate">
                  <div className="w-1.5 h-1.5 rounded-full bg-fail flex-shrink-0" />
                  <span className="truncate">{topic}</span>
                </li>
              ))}
              {weakTopics.length > 3 && (
                <li className="text-[11px] text-gray-400 dark:text-muted pl-4">
                  + {weakTopics.length - 3} more topics identified
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={onClose}
            className={`h-12 border-none font-bold text-sm
              ${passed ? "bg-pass hover:bg-green-600" : "bg-fail hover:bg-red-600"}
            `}
          >
            {passed ? "Advance to Next Week" : "Return to Saturday Revision"}
          </Button>
          
          <p className="text-[10px] text-gray-400 dark:text-muted uppercase tracking-[0.2em] font-medium mt-2">
            Progress Saved
          </p>
        </div>
      </div>
    </div>
  );
}
