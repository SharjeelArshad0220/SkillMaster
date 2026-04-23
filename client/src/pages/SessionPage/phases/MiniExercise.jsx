import { useState } from 'react';
import Button from '../../../components/ui/Button';

/**
 * Mini exercise shown after the last card of each lesson part.
 * Props:
 *   exercise    - { question, options[], correctIndex, explanation }
 *   onComplete  - called when user clicks Check Answer (notifies parent mini is answered)
 *   onAdvance   - called when user clicks Next Part / Proceed to Task
 *   isLastPart  - boolean, controls button label
 *   miniDone    - boolean, whether mini has already been answered (from parent state)
 */
export default function MiniExercise({ exercise, onComplete, onAdvance, isLastPart, miniDone }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  if (!exercise) return null;

  const handleCheck = () => {
    if (selected === null) return;
    setAnswered(true);
    onComplete(); // notify parent that mini is answered
  };

  return (
    <div className="bg-white dark:bg-navy-mid
                    border border-gray-200 dark:border-navy-light
                    rounded-xl p-8 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-accent-dk dark:bg-accent" />
        <p className="text-xs font-bold uppercase tracking-[0.1em]
                      text-accent-dk dark:text-accent">
          Mini Exercise
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 leading-snug">
        {exercise.question}
      </h3>

      <div className="flex flex-col gap-3">
        {exercise.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => !answered && setSelected(i)}
            disabled={answered}
            className={`flex items-center gap-4 h-14 px-5 rounded-[10px]
                        border-[1.5px] text-sm font-medium text-left transition-all
              ${answered && i === exercise.correctIndex
                ? 'bg-pass/10 border-pass text-pass'
                : answered && i === selected && i !== exercise.correctIndex
                ? 'bg-fail/10 border-fail text-fail'
                : selected === i && !answered
                ? 'bg-sky-50 dark:bg-accent/10 border-accent-dk dark:border-accent text-gray-900 dark:text-white'
                : 'bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate'
              }`}
          >
            <div className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0
                             flex items-center justify-center
              ${selected === i
                ? 'border-accent-dk dark:border-accent'
                : 'border-gray-300 dark:border-divider'
              }`}>
              {selected === i && (
                <div className="w-2.5 h-2.5 rounded-full bg-accent-dk dark:bg-accent" />
              )}
            </div>
            {opt}
          </button>
        ))}
      </div>

      {answered && (
        <div className="mt-5 p-4 rounded-lg bg-gray-50 dark:bg-navy
                        border border-gray-200 dark:border-divider animate-fade-in">
          <p className={`text-sm font-bold mb-1 ${selected === exercise.correctIndex ? 'text-pass' : 'text-fail'}`}>
            {selected === exercise.correctIndex ? 'Correct!' : 'Not quite.'}
          </p>
          <p className="text-sm text-gray-600 dark:text-slate leading-relaxed">
            {exercise.explanation}
          </p>
        </div>
      )}

      <div className="mt-6">
        {!answered ? (
          <Button
            variant="primary"
            disabled={selected === null}
            onClick={handleCheck}
            fullWidth
          >
            Check Answer
          </Button>
        ) : (
          <Button variant="primary" onClick={onAdvance} fullWidth>
            {isLastPart ? 'Proceed to Task →' : 'Next Part →'}
          </Button>
        )}
      </div>
    </div>
  );
}
