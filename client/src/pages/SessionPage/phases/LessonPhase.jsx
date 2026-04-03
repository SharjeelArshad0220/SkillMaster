import { useState } from "react";
import PartCard from "./PartCard";
import MiniExercise from "./MiniExercise";

/**
 * Orchestrates the lesson parts, cards, and mini-exercises.
 */
export default function LessonPhase({ lesson, onComplete }) {
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showExercise, setShowExercise] = useState(false);

  const activePart = lesson.parts[currentPartIdx];
  const activeCard = activePart.cards[currentCardIdx];
  const totalParts = lesson.parts.length;
  
  // Progress Calculation: weight each part and card equally
  const progressPercent = ((currentPartIdx) / totalParts) * 100 + 
                          ((currentCardIdx + 1) / (activePart.cards.length * totalParts)) * 100;

  const handleNextCard = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentCardIdx(prev => prev + 1);
  };

  const handlePrevCard = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentCardIdx(prev => prev - 1);
  };
  
  const handleExerciseComplete = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentPartIdx < totalParts - 1) {
      setCurrentPartIdx(prev => prev + 1);
      setCurrentCardIdx(0);
      setShowExercise(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="animate-fade-in relative">
      {/* Progress Section */}
      <div className="mb-8">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted mb-2.5">
          <span>Part {currentPartIdx + 1} of {totalParts}</span>
          <span>{Math.round(progressPercent)}% Session Progress</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-divider rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent-dk dark:bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {!showExercise ? (
        <PartCard
          content={activeCard.content}
          title={activePart.partTitle}
          isFirst={currentPartIdx === 0 && currentCardIdx === 0}
          isLast={currentCardIdx === activePart.cards.length - 1}
          hasExercise={!!activePart.miniExercise}
          isLastPart={currentPartIdx === totalParts - 1}
          onNext={handleNextCard}
          onBack={handlePrevCard}
          onExercise={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (activePart.miniExercise) {
              setShowExercise(true);
            } else {
              handleExerciseComplete();
            }
          }}
        />
      ) : (
        <MiniExercise
          exercise={activePart.miniExercise}
          isLastPart={currentPartIdx === totalParts - 1}
          onComplete={handleExerciseComplete}
        />
      )}
    </div>
  );
}
