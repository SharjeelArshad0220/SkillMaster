import Button from "../../../components/ui/Button";

/**
 * Displays AI feedback and task outcomes (Positive or Needs Improvement).
 */
export default function FeedbackPhase({ feedbackData, onClose }) {
  const { feedback, outcome } = feedbackData;
  const isPositive = outcome === "positive";

  // Split feedback text into paragraphs for cleaner rendering
  const paragraphs = feedback.split("\n").filter(para => para.trim() !== "");

  return (
    <div className="bg-white dark:bg-navy-mid 
                   border border-gray-200 dark:border-navy-light 
                   rounded-xl p-8 shadow-sm animate-fade-in transition-all">
      
      {/* Outcome Indicator Banner */}
      <div className={`flex items-center gap-4 p-5 rounded-xl mb-8 border transition-all duration-300
        ${isPositive 
          ? "bg-pass/10 border-pass/30 dark:border-pass/20" 
          : "bg-warn/10 border-warn/30 dark:border-warn/20"
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
          ${isPositive ? "bg-pass text-white" : "bg-warn text-white"}`}
        >
          {isPositive ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div>
          <h4 className={`text-base font-bold ${isPositive ? "text-pass" : "text-warn"}`}>
            {isPositive ? "Excellent Progress!" : "Keep Working on It"}
          </h4>
          <p className={`text-sm opacity-80 ${isPositive ? "text-pass" : "text-warn"}`}>
            {isPositive 
              ? "Your response demonstrates a strong understanding of today's lesson." 
              : "We've identified some areas that need more attention. Review the feedback below."}
          </p>
        </div>
      </div>

      {/* AI Feedback Body */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-accent-dk dark:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.9-.4-2.524-1.052l-.548-.547z" />
          </svg>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent-dk dark:text-accent">
            AI Tutors Review
          </p>
        </div>
        
        <div className="space-y-4 border-l-2 border-gray-100 dark:border-divider pl-6 ml-2">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-[15px] text-gray-600 dark:text-slate leading-[1.75]">
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-12 pt-8 border-t border-gray-100 dark:border-divider">
        <Button variant="primary" onClick={onClose} fullWidth>
          Finish Today's Session
        </Button>
        <p className="text-center text-[10px] text-gray-400 dark:text-muted mt-4 uppercase tracking-widest font-medium">
          Session data will be synchronized with your roadmap
        </p>
      </div>
    </div>
  );
}
