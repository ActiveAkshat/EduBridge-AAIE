import { useState } from "react";
import { Loader, RotateCcw, Eye, CheckCircle, XCircle, ChevronRight } from "lucide-react";

/**
 * Conversational MCQ component — Google "Learn About" style.
 * Per question states:
 *   idle       → student hasn't answered yet
 *   wrong      → selected wrong answer, can retry or show answer
 *   correct    → selected correct answer, shows explanation
 *   revealed   → student clicked "Show Answer"
 */

const STATES = { IDLE: "idle", WRONG: "wrong", CORRECT: "correct", REVEALED: "revealed" };

const MCQ = ({ questions, isLoading, error, onRetry }) => {
  // { [qIdx]: { state, selectedIdx, attempts } }
  const [qStates, setQStates] = useState({});

  const getQ = (idx) => qStates[idx] || { state: STATES.IDLE, selectedIdx: null, attempts: 0 };

  const handleSelect = (qIdx, optIdx) => {
    const q = getQ(qIdx);
    // Lock if already correct or revealed
    if (q.state === STATES.CORRECT || q.state === STATES.REVEALED) return;

    const isCorrect = optIdx === questions[qIdx].correct_index;

    setQStates(prev => ({
      ...prev,
      [qIdx]: {
        state: isCorrect ? STATES.CORRECT : STATES.WRONG,
        selectedIdx: optIdx,
        attempts: (q.attempts || 0) + 1,
      }
    }));
  };

  const handleTryAgain = (qIdx) => {
    setQStates(prev => ({
      ...prev,
      [qIdx]: { state: STATES.IDLE, selectedIdx: null, attempts: getQ(qIdx).attempts }
    }));
  };

  const handleShowAnswer = (qIdx) => {
    setQStates(prev => ({
      ...prev,
      [qIdx]: { ...getQ(qIdx), state: STATES.REVEALED, selectedIdx: questions[qIdx].correct_index }
    }));
  };

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) return (
    <div className="mt-8 pt-6 border-t border-gray-700">
      <div className="flex items-center gap-3 text-gray-400 py-4">
        <Loader size={18} className="animate-spin text-orange-400" />
        <span className="text-sm font-medium">Generating comprehension questions...</span>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────
  if (error) return (
    <div className="mt-8 pt-6 border-t border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 bg-red-900/20 border border-red-500/40 rounded-xl">
        <p className="text-red-300 text-sm">Could not load questions.</p>
        <button onClick={onRetry} className="flex items-center gap-1.5 text-sm text-red-300 hover:text-white transition">
          <RotateCcw size={13} /> Retry
        </button>
      </div>
    </div>
  );

  if (!questions?.length) return null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-700 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
          <span className="text-base">🧠</span>
        </div>
        <div>
          <h3 className="text-white font-semibold text-base">Quick Check</h3>
          <p className="text-gray-400 text-xs">Test your understanding of this topic</p>
        </div>
      </div>

      {questions.map((q, qIdx) => {
        const qs = getQ(qIdx);
        const isIdle     = qs.state === STATES.IDLE;
        const isWrong    = qs.state === STATES.WRONG;
        const isCorrect  = qs.state === STATES.CORRECT;
        const isRevealed = qs.state === STATES.REVEALED;
        const isDone     = isCorrect || isRevealed;

        return (
          <div key={qIdx} className="space-y-3">

            {/* Question */}
            <p className="text-white font-medium text-sm leading-relaxed">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold mr-2">
                {qIdx + 1}
              </span>
              {q.question}
            </p>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => {
                const isSelected  = qs.selectedIdx === oIdx;
                const isCorrectOpt = oIdx === q.correct_index;

                let cls = "border border-gray-600 bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white cursor-pointer";

                if (!isIdle) {
                  if (isCorrectOpt && isDone) {
                    cls = "border border-green-500 bg-green-900/30 text-green-200 cursor-default";
                  } else if (isSelected && isWrong) {
                    cls = "border border-red-500 bg-red-900/30 text-red-200 cursor-default";
                  } else {
                    cls = "border border-gray-700 bg-gray-800/50 text-gray-500 cursor-default opacity-50";
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelect(qIdx, oIdx)}
                    disabled={!isIdle}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-150 flex items-center justify-between gap-3 ${cls}`}
                  >
                    <span>{opt}</span>
                    {isCorrectOpt && isDone && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
                    {isSelected && isWrong    && <XCircle size={16} className="text-red-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Conversational feedback */}
            {isWrong && (
              <div className="rounded-xl bg-gray-900/60 border border-gray-600 px-4 py-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">🤔</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Not quite! Please try again.</p>
                    {q.hint && (
                      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{q.hint}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => handleTryAgain(qIdx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition"
                  >
                    <RotateCcw size={12} /> Try Again
                  </button>
                  <button
                    onClick={() => handleShowAnswer(qIdx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition"
                  >
                    <Eye size={12} /> Show Answer
                  </button>
                </div>
              </div>
            )}

            {isCorrect && (
              <div className="rounded-xl bg-green-900/20 border border-green-500/40 px-4 py-4">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">🎉</span>
                  <div>
                    <p className="text-green-300 font-semibold text-sm">Correct! Well done!</p>
                    {q.explanation && (
                      <p className="text-gray-300 text-sm mt-1 leading-relaxed">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isRevealed && (
              <div className="rounded-xl bg-yellow-900/20 border border-yellow-500/40 px-4 py-4">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">💡</span>
                  <div>
                    <p className="text-yellow-300 font-semibold text-sm">Here's the answer!</p>
                    {q.explanation && (
                      <p className="text-gray-300 text-sm mt-1 leading-relaxed">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Next question nudge */}
            {isCorrect && qIdx < questions.length - 1 && (
              <p className="text-green-400 text-xs flex items-center gap-1 pl-1">
                <ChevronRight size={13} /> Keep going — next question below
              </p>
            )}

          </div>
        );
      })}

      {/* All done */}
      {questions.length > 0 && questions.every((_, i) => {
        const s = getQ(i).state;
        return s === STATES.CORRECT || s === STATES.REVEALED;
      }) && (
        <div className="rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 px-5 py-4 text-center">
          <p className="text-white font-semibold text-sm">
            {questions.every((_, i) => getQ(i).state === STATES.CORRECT)
              ? "🌟 Perfect! You understood this topic well!"
              : "📖 Review the highlighted answers and keep reading!"}
          </p>
        </div>
      )}

    </div>
  );
};

export default MCQ;