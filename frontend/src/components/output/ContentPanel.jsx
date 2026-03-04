import { useEffect, useRef, useState } from "react";
import { RefreshCw, Volume2, Loader, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import * as api from "../../services/api";
import QuickCheck from "./QuickCheck";

// ── Helpers ────────────────────────────────────────────────────
const escapeHtml = (s) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const renderStylometry = (text) => {
  const safe = escapeHtml(text || "");
  let html = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = html.split("\n");
  let out = [];
  let inUl = false;

  for (let ln of lines) {
    const raw = ln.trim();
    if (raw.startsWith("- ")) {
      if (!inUl) {
        out.push("<ul style='margin-top:10px;margin-bottom:10px;padding-left:22px;'>");
        inUl = true;
      }
      out.push(`<li style='margin-bottom:6px;'>${raw.slice(2)}</li>`);
    } else {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (raw === "") {
        out.push("<div style='height:10px'></div>");
      } else {
        out.push(`<p style='margin:0 0 10px 0; line-height:1.7;'>${ln}</p>`);
      }
    }
  }
  if (inUl) out.push("</ul>");
  return out.join("");
};

// ── Component ──────────────────────────────────────────────────
const ContentPanel = ({
  selectedTopic,
  simplifiedTopics,
  selectedLanguage,
  isSimplifying,
  isTranslating,
  simplificationProgress,
  translationProgress,
  onRetrySimplification,
}) => {
  // Audio state
  const audioRef = useRef(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError]               = useState(null);
  const [isPlaying, setIsPlaying]                 = useState(false);
  const [currentTime, setCurrentTime]             = useState(0);
  const [duration, setDuration]                   = useState(0);
  const [audioLoaded, setAudioLoaded]             = useState(false);

  // QuickCheck state
  const [qcQuestions, setQcQuestions]             = useState(null);
  const [qcLoading, setQcLoading]                 = useState(false);
  const [qcError, setQcError]                     = useState(null);

  // ── Audio listeners ────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime     = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded    = () => setIsPlaying(false);
    audio.addEventListener("timeupdate",     updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended",          handleEnded);
    return () => {
      audio.removeEventListener("timeupdate",     updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended",          handleEnded);
    };
  }, [audioLoaded]);

  // ── Reset on topic change ──────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setAudioLoaded(false);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);
    }
    // Reset quick check too
    setQcQuestions(null);
    setQcError(null);
  }, [selectedTopic]);

  // ── Auto-generate QuickCheck when topic content is ready ──
  useEffect(() => {
    if (selectedTopic && selectedTopic.content && !selectedTopic.error && !isSimplifying && !isTranslating) {
      fetchQuickCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic?.topic]);

  const fetchQuickCheck = async () => {
    if (!selectedTopic) return;
    setQcLoading(true);
    setQcError(null);
    setQcQuestions(null);
    try {
      const content = selectedLanguage === "hindi" && selectedTopic.content_hindi
        ? selectedTopic.content_hindi
        : selectedTopic.content;
      const res = await api.generateQuickCheck(selectedTopic.topic, content);
      setQcQuestions(res.data.data.questions);
    } catch (err) {
      setQcError(err.response?.data?.message || err.message || "Failed to load questions");
    } finally {
      setQcLoading(false);
    }
  };

  // ── Audio handlers ─────────────────────────────────────────
  const handleGenerateAudio = async () => {
    if (!selectedTopic) return;
    setIsGeneratingAudio(true);
    setAudioError(null);
    setAudioLoaded(false);
    try {
      const textToSpeak = selectedLanguage === "hindi" && selectedTopic.content_hindi
        ? selectedTopic.content_hindi
        : selectedTopic.content;
      const response = await api.generateAudio(textToSpeak, selectedLanguage);
      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl  = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setAudioLoaded(true);
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setAudioError(err.response?.data?.message || err.message || "Failed to generate audio");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else           { audioRef.current.play();  setIsPlaying(true);  }
  };

  const handleSeek = (e) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) { audioRef.current.currentTime = t; setCurrentTime(t); }
  };

  const formatTime = (t) => {
    if (isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <section className="flex-1 bg-gray-800 rounded-xl shadow-md p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
      <audio ref={audioRef} />

      {isSimplifying || isTranslating ? (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-medium">
                {isSimplifying ? "Simplifying topics..." : "Translating to Hindi..."}
              </span>
              <span className="text-blue-400 font-semibold">
                {isSimplifying ? simplificationProgress : translationProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${isSimplifying ? simplificationProgress : translationProgress}%` }}
              />
            </div>
          </div>
        </div>

      ) : selectedTopic ? (
        <div className="rounded-lg shadow-inner">

          {/* Topic header */}
          <div className="mb-4 border-b border-gray-600 pb-3">
            <h2 className="text-2xl font-bold text-blue-300">{selectedTopic.topic}</h2>
            {selectedLanguage === "hindi" && selectedTopic.topic_hindi && (
              <h3 className="text-xl font-semibold text-blue-200 mt-2">{selectedTopic.topic_hindi}</h3>
            )}
          </div>

          {selectedTopic.error ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
              <p className="text-red-300 mb-3">Error simplifying this topic: {selectedTopic.error}</p>
              <button
                onClick={() => {
                  const idx = simplifiedTopics.findIndex((t) => t.topic === selectedTopic.topic);
                  if (idx !== -1) onRetrySimplification(idx);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                <RefreshCw size={16} /> Retry Simplification
              </button>
            </div>
          ) : (
            <>
              {/* Simplified content */}
              <div
                className="text-gray-200 text-base"
                dangerouslySetInnerHTML={{
                  __html: renderStylometry(
                    selectedLanguage === "hindi" && selectedTopic.content_hindi
                      ? selectedTopic.content_hindi
                      : selectedTopic.content
                  ),
                }}
              />

              {/* ── Audio Section ─────────────────────────────────── */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Volume2 size={20} className="text-blue-400" /> Audio Playback
                    </h3>
                    {audioLoaded && (
                      <span className="text-sm text-gray-400">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    )}
                  </div>

                  {audioError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                      <p className="text-red-300 text-sm">{audioError}</p>
                    </div>
                  )}

                  {!audioLoaded ? (
                    <button
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio}
                      className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all ${
                        isGeneratingAudio ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                      } text-white`}
                    >
                      {isGeneratingAudio
                        ? <><Loader size={20} className="animate-spin" /><span>Generating Audio...</span></>
                        : <><Volume2 size={20} /><span>Generate Audio</span></>}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="range" min="0" max={duration || 0} value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}
                          className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full"
                        >
                          <SkipBack size={20} className="text-white" />
                        </button>
                        <button onClick={togglePlayPause} className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full">
                          {isPlaying
                            ? <Pause size={24} className="text-white" fill="white" />
                            : <Play  size={24} className="text-white ml-1" fill="white" />}
                        </button>
                        <button
                          onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }}
                          className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full"
                        >
                          <SkipForward size={20} className="text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Quick Check ───────────────────────────────────── */}
              <QuickCheck
                questions={qcQuestions}
                isLoading={qcLoading}
                error={qcError}
                onRetry={fetchQuickCheck}
              />
            </>
          )}
        </div>

      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-lg">Select a topic to view content</p>
        </div>
      )}
    </section>
  );
};

export default ContentPanel;