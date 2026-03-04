import { useState, useEffect } from "react";
import { X, RefreshCw, ChevronLeft, ChevronRight, Loader, RotateCcw } from "lucide-react";
import * as api from "../../services/api";

const GRADIENTS = [
  'from-purple-600 via-purple-500 to-pink-500',
  'from-blue-600 via-blue-500 to-cyan-500',
  'from-green-600 via-emerald-500 to-teal-500',
  'from-orange-600 via-orange-500 to-yellow-500',
  'from-red-600 via-rose-500 to-pink-500',
  'from-indigo-600 via-purple-500 to-pink-500',
  'from-teal-600 via-cyan-500 to-blue-500',
  'from-amber-600 via-orange-500 to-red-500',
];

const FlashcardModal = ({ flashcards, isLoading, error, topicName, selectedLanguage, onClose, onRetry }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // ── Explanation states ─────────────────────────────────────
  const [showExplanation, setShowExplanation]           = useState(false);
  const [explanation, setExplanation]                   = useState(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError]         = useState(null);

  // Reset explanation when card changes
  useEffect(() => {
    setShowExplanation(false);
    setExplanation(null);
    setExplanationError(null);
  }, [currentIndex]);

  if (isLoading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="flex flex-col items-center space-y-4">
        <Loader size={48} className="animate-spin text-green-500" />
        <p className="text-gray-300 text-lg">Generating flashcards...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Error</h3>
          <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
        </div>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
          <p className="text-red-300 text-center mb-4">Failed to generate flashcards: {error}</p>
          <button onClick={onRetry} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    </div>
  );

  if (!flashcards?.length) return null;

  const card     = flashcards[currentIndex];
  const total    = flashcards.length;
  const gradient = GRADIENTS[currentIndex % GRADIENTS.length];

  const goNext = () => { if (currentIndex < total - 1) { setCurrentIndex(i => i + 1); setIsFlipped(false); } };
  const goPrev = () => { if (currentIndex > 0)         { setCurrentIndex(i => i - 1); setIsFlipped(false); } };

  // ── Explain handler ────────────────────────────────────────
  const handleExplain = async (e) => {
    e.stopPropagation(); // prevent card flip

    if (showExplanation) {
      setShowExplanation(false);
      return;
    }

    setIsLoadingExplanation(true);
    setExplanationError(null);

    try {
      const response = await api.explainFlashcard(card.question, card.answer, selectedLanguage);
      setExplanation(response.data.data.explanation);
      setShowExplanation(true);
    } catch (err) {
      setExplanationError(err.response?.data?.message || err.message || "Failed to generate explanation");
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{topicName} Flashcards</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition text-white">
            <X size={24} />
          </button>
        </div>

        <div className="relative perspective-container">
          <div className={`flashcard-3d ${isFlipped ? "flipped" : ""}`} onClick={() => setIsFlipped(f => !f)} style={{ cursor: "pointer" }}>

            {/* FRONT */}
            <div className={`flashcard-face flashcard-front bg-gradient-to-br ${gradient} rounded-3xl p-12 shadow-2xl border-2 border-white/20 min-h-[400px] flex flex-col items-center justify-center`}>
              <p className="text-white text-2xl leading-relaxed font-medium drop-shadow-lg text-center">{card.question}</p>
            </div>

            {/* BACK */}
            <div className={`flashcard-face flashcard-back bg-gradient-to-br ${gradient} rounded-3xl p-12 shadow-2xl border-2 border-white/20 min-h-[400px] flex flex-col items-center justify-center`}>
              <div className="text-center w-full">
                <p className="text-white text-2xl leading-relaxed font-medium drop-shadow-lg mb-6">{card.answer}</p>

                {/* ── Explain button ── */}
                <button
                  onClick={handleExplain}
                  disabled={isLoadingExplanation}
                  className={`flex items-center gap-2 mx-auto px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg text-sm transition border border-white/30 ${
                    isLoadingExplanation ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoadingExplanation
                    ? <><Loader size={16} className="animate-spin" /> Loading...</>
                    : <><RotateCcw size={16} /> {showExplanation ? "Hide" : "Explain"}</>
                  }
                </button>

                {/* ── Explanation text ── */}
                {showExplanation && explanation && (
                  <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <p className="text-white text-base leading-relaxed">{explanation}</p>
                  </div>
                )}

                {/* ── Explanation error ── */}
                {explanationError && (
                  <div className="mt-4 p-4 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-400/30">
                    <p className="text-red-200 text-sm">{explanationError}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8">
          <button onClick={goPrev} disabled={currentIndex === 0}
            className={`p-3 rounded-full transition ${currentIndex === 0 ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
            <ChevronLeft size={24} />
          </button>
          <div className="text-white text-lg font-semibold min-w-[80px] text-center">{currentIndex + 1} / {total}</div>
          <button onClick={goNext} disabled={currentIndex === total - 1}
            className={`p-3 rounded-full transition ${currentIndex === total - 1 ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <style>{`
        .perspective-container { perspective: 1000px; }
        .flashcard-3d { position: relative; width: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
        .flashcard-3d.flipped { transform: rotateY(180deg); }
        .flashcard-face { width: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .flashcard-front { position: relative; }
        .flashcard-back { position: absolute; top: 0; left: 0; transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardModal;