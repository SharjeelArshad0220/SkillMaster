import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import MiniExercise from './MiniExercise';
import Button from '../../../components/ui/Button';

/**
 * Orchestrates lesson parts, cards, and mini-exercises.
 * Props:
 *   parts      - array of { partNumber, partTitle, cards: [{cardNumber, content}], miniExercise }
 *   onComplete - called after last part's mini exercise is done
 */
export default function LessonPhase({ parts, onComplete }) {
  const [partIndex, setPartIndex] = useState(0);    // which part (0, 1, 2)
  const [cardIndex, setCardIndex] = useState(0);    // which card within current part
  const [showMini, setShowMini] = useState(false);  // show mini exercise after last card
  const [miniDone, setMiniDone] = useState(false);  // mini exercise has been answered

  const activePart = parts[partIndex];
  const activeCard = activePart.cards[cardIndex];
  const isLastCard = cardIndex === activePart.cards.length - 1;
  const isLastPart = partIndex === parts.length - 1;

  // Progress calculation
  const totalCards = parts.reduce((sum, p) => sum + p.cards.length, 0);
  const completedCards = parts
    .slice(0, partIndex)
    .reduce((sum, p) => sum + p.cards.length, 0) + cardIndex;
  const overallProgress = Math.round((completedCards / totalCards) * 100);

  const handleNextCard = () => {
    if (!isLastCard) {
      setCardIndex(c => c + 1);
    } else {
      // Last card of this part — show mini exercise
      setShowMini(true);
    }
  };

  const handleMiniComplete = () => {
    setMiniDone(true);
    // Parent waits for user to click Next Part / Proceed to Task
  };

  const handleAdvance = () => {
    if (!isLastPart) {
      setPartIndex(p => p + 1);
      setCardIndex(0);
      setShowMini(false);
      setMiniDone(false);
    } else {
      // All parts done — go to task
      onComplete();
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest
                        text-gray-400 dark:text-muted mb-2.5">
          <span>Part {partIndex + 1} of {parts.length}</span>
          <span>{overallProgress}% complete</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-dk dark:bg-accent rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {!showMini ? (
        /* Card display */
        <div className="bg-white dark:bg-navy-mid
                        border border-gray-200 dark:border-navy-light
                        rounded-xl p-6 md:p-8 shadow-sm flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                        text-accent-dk dark:text-accent mb-4 shrink-0">
            {activePart.partTitle}
          </p>
          <div className="flex-1 mb-6 overflow-x-auto">
                <div className="
                        prose prose-sm max-w-none
                        prose-p:text-gray-600 prose-p:dark:text-slate prose-p:leading-relaxed prose-p:my-2
                        prose-strong:text-gray-900 prose-strong:dark:text-white prose-strong:font-semibold
                        prose-ul:text-gray-600 prose-ul:dark:text-slate
                        prose-li:text-gray-600 prose-li:dark:text-slate prose-li:my-0.5
                        prose-code:text-gray-900 prose-code:dark:text-accent
                        prose-code:bg-gray-100 prose-code:dark:bg-navy
                        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]
                        prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-gray-100 prose-pre:dark:bg-navy
                        prose-pre:border prose-pre:border-gray-200 prose-pre:dark:border-divider
                        prose-pre:rounded-lg prose-pre:text-[13px] prose-pre:overflow-x-auto prose-pre:my-3
                        prose-pre:code:bg-transparent prose-pre:code:p-0 prose-pre:code:text-gray-900 prose-pre:code:dark:text-accent
                        prose-headings:text-gray-900 prose-headings:dark:text-white">
              <ReactMarkdown>{activeCard.content}</ReactMarkdown>
            </div>
          </div>
          <div className="flex justify-between mt-auto shrink-0 pt-4 border-t border-gray-100 dark:border-divider">
            {cardIndex > 0 && (
              <Button variant="secondary" onClick={() => setCardIndex(c => c - 1)}>
                ← Previous
              </Button>
            )}
            <div className="ml-auto">
              <Button variant="primary" onClick={handleNextCard}>
                {isLastCard ? 'Continue to Exercise →' : 'Next Card →'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Mini Exercise */
        <MiniExercise
          exercise={activePart.miniExercise}
          onComplete={handleMiniComplete}
          onAdvance={handleAdvance}
          isLastPart={isLastPart}
          miniDone={miniDone}
        />
      )}
    </div>
  );
}
