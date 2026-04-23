import Button from "../../../components/ui/Button";

/**
 * Renders a single lesson card with content and navigation.
 */
export default function PartCard({ 
  content, 
  title, 
  isFirst, 
  isLast, 
  hasExercise,
  isLastPart,
  onNext, 
  onBack, 
  onExercise 
}) {
  const getNextLabel = () => {
    if (isLast) {
      if (hasExercise) return "Continue to Exercise →";
      if (isLastPart) return "Finish Lesson →";
      return "Next Part →";
    }
    return "Next Card →";
  };

  return (
    <div className="bg-white dark:bg-navy-mid 
                    border border-gray-200 dark:border-navy-light 
                    rounded-xl p-8 md:p-10 shadow-sm animate-fade-in transition-all">
      <div className="flex flex-col h-full">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent-dk dark:text-accent mb-4">
          {title}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none flex-grow">
          <p className="text-[15px] text-gray-600 dark:text-slate leading-[1.75] whitespace-pre-wrap">
            {content}
          </p>
        </div>

        <div className="flex justify-between mt-10 pt-6 border-t border-gray-100 dark:border-divider">
          <div>
            {!isFirst && (
              <Button variant="secondary" onClick={onBack}>
                ← Previous
              </Button>
            )}
          </div>
          <div className="ml-auto">
            <Button variant="primary" onClick={isLast ? onExercise : onNext}>
              {getNextLabel()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
