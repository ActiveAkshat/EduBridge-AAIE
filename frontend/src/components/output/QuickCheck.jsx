import { useState } from "react";
import { Loader, CheckCircle, XCircle, Eye, RotateCcw, ChevronRight } from "lucide-react";

/**
 * QuickCheck — 1-2 MCQs generated from topic content.
 * Props:
 *   questions: [{ question, options, correct_index, explanation }]
 *   isLoading: bool
 *   error: string | null
 *   onRetry: fn
 */

const QuickCheck = ({ questions, isLoading, error, onRetry }) => {
  // Per-question state: null | "answered" | "revealed"
  const [states, setStates] = useState({});       // { [qIdx]: { selected, status } }
  const [revealed, setRevealed] = useState({});   // { [qIdx]: true }

  if (isLoading) return (
    <div className="flex items-center gap-3 py-6 justify-center text-gray-400">
      <Loader size={20} className="animate-spin text-orange-400" />
      <span className="text-sm">Generating quick check questions...</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-between py-4 px-4 bg-red-900/20 border border-red-500/40 rounded-lg">
      <p className="text-red-300 text-sm">Could not generate questions.</p>
      <button onClick={onRetry} className="flex items-center gap-1 text-sm text-red-300 hover:text-white transition">
        <RotateCcw size={14} /> Retry
      </button>
    </div>
  );

  if (!questions?.length) return null;

  const handleSelect = (qIdx, optIdx) => {
    // If already answered or revealed, ignore
    if (states[qIdx] || revealed[qIdx]) return;

    const correct = questions[qIdx].correct_index;
    const isCorrect = optIdx === correct;

    setStates(prev => ({
      ...prev,
      [qIdx]: { selected: optIdx, correct: isCorrect }
    }));
  };

  const handleShowAnswer = (qIdx) => {
    setRevealed(prev => ({ ...prev, [qIdx]: true }));
    // Also mark as answered so options lock
    if (!states[qIdx]) {
      setStates(prev => ({ ...prev, [qIdx]: { selected: null, correct: false, revealed: true } }));
    }
  };

  const handleReset = (qIdx) => {
    setStates(prev => { const n = { ...prev }; delete n[qIdx]; return n; });
    setRevealed(prev => { const n = { ...prev }; delete n[qIdx]; return n; });
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-700 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🧠</span>
        <h3 className="text-lg font-semibold text-white">Take a quiz to check your understanding</h3>
      </div>

      {questions.map((q, qIdx) => {
        const state     = states[qIdx];
        const isReveal  = revealed[qIdx];
        const answered  = !!state;
        const correct   = q.correct_index;

        return (
          <div key={qIdx} className="bg-gray-750 border border-gray-600 rounded-xl p-5 space-y-4">
            {/* Question */}
            <p className="text-white font-medium leading-relaxed">
              <span className="text-orange-400 font-bold mr-2">Q{qIdx + 1}.</span>
              {q.question}
            </p>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => {
                const isSelected  = state?.selected === oIdx;
                const isCorrectOpt = oIdx === correct;
                const showCorrect  = (answered || isReveal) && isCorrectOpt;
                const showWrong    = answered && isSelected && !state.correct;

                let style = "border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-gray-500 text-gray-200 cursor-pointer";
                if (showCorrect)   style = "border-green-500 bg-green-900/40 text-green-200 cursor-default";
                else if (showWrong) style = "border-red-500 bg-red-900/40 text-red-200 cursor-default";
                else if (answered || isReveal) style = "border-gray-600 bg-gray-700 text-gray-400 cursor-default opacity-60";

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelect(qIdx, oIdx)}
                    disabled={answered || isReveal}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 text-sm flex items-center justify-between gap-3 ${style}`}
                  >
                    <span>{opt}</span>
                    {showCorrect && <CheckCircle size={18} className="text-green-400 flex-shrink-0" />}
                    {showWrong   && <XCircle size={18} className="text-red-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {answered && !isReveal && (
              <div className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                state.correct
                  ? "bg-green-900/30 border border-green-500/50 text-green-200"
                  : "bg-red-900/30 border border-red-500/50 text-red-200"
              }`}>
                {state.correct ? (
                  <>
                    <span className="font-bold">✅ Correct!</span>{" "}
                    {q.explanation}
                  </>
                ) : state.revealed ? (
                  <>
                    <span className="font-bold text-yellow-300">💡 The correct answer is shown above.</span>{" "}
                    {q.explanation}
                  </>
                ) : (
                  <span className="font-bold">❌ Incorrect! Please try again.</span>
                )}
              </div>
            )}

            {/* Revealed via "Show Answer" (no prior attempt) */}
            {isReveal && !state?.selected && (
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg px-4 py-3 text-sm text-yellow-200 leading-relaxed">
                <span className="font-bold">💡 Answer revealed.</span>{" "}
                {q.explanation}
              </div>
            )}

            {/* Action row */}
            <div className="flex items-center gap-3 pt-1">
              {/* Show answer — only before answering correctly */}
              {!isReveal && !(state?.correct) && (
                <button
                  onClick={() => handleShowAnswer(qIdx)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
                >
                  <Eye size={15} /> Show the answer
                </button>
              )}

              {/* Try again — only after wrong attempt */}
              {answered && !state?.correct && !isReveal && (
                <button
                  onClick={() => handleReset(qIdx)}
                  className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition ml-auto"
                >
                  <RotateCcw size={15} /> Try again
                </button>
              )}

              {/* Next indicator after correct */}
              {state?.correct && qIdx < questions.length - 1 && (
                <span className="text-sm text-green-400 ml-auto flex items-center gap-1">
                  Next question below <ChevronRight size={14} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickCheck;