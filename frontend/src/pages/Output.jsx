import { useState, useEffect, useRef } from "react";
import { ArrowLeft, FileText, Layers, Loader } from "lucide-react";
import * as api from "../services/api";

import TopicsSidebar  from "../components/output/TopicsSidebar";
import ContentPanel   from "../components/output/ContentPanel";
import Studio         from "../components/output/Studio";
import MindmapModal   from "../components/output/MindmapModal";
import FlashcardModal from "../components/output/FlashcardModal";
import QuizModal      from "../components/output/QuizModal";
import ImagesModal    from "../components/output/ImagesModal";
import InsightsModal  from "../components/output/InsightsModal";
import useExportPDF   from "../hooks/useExportPDF";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const Output = ({ extractedData, originalData, onBack, selectedLanguage }) => {
  const topics = Array.isArray(extractedData) ? extractedData : [];

  // Core state
  const [selectedTopic, setSelectedTopic]       = useState(null);
  const [simplifiedTopics, setSimplifiedTopics] = useState([]);
  const [simplificationProgress, setSimplificationProgress] = useState(0);
  const [isSimplifying, setIsSimplifying]       = useState(true);
  const [simplificationErrors, setSimplificationErrors] = useState({});
  const [isProcessing, setIsProcessing]         = useState(false);
  const [isTranslating, setIsTranslating]       = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  // Mindmap cache: { [topicName]: mindmapData }
  // Shared across Studio mindmap view AND PDF export
  const [mindmapCache, setMindmapCache]         = useState({});

  // Mindmap modal state
  const [showMindmap, setShowMindmap]           = useState(false);
  const [activeMindmapData, setActiveMindmapData] = useState(null);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [mindmapError, setMindmapError]         = useState(null);
  const [isDownloadingMindmap, setIsDownloadingMindmap] = useState(false);

  // Mindmap Explain states
  const [isExplainingMindmap, setIsExplainingMindmap] = useState(false);
  const [explainAudioLoaded, setExplainAudioLoaded] = useState(false);
  const [isExplainPlaying, setIsExplainPlaying] = useState(false);
  const [explainCurrentTime, setExplainCurrentTime] = useState(0);
  const [explainDuration, setExplainDuration] = useState(0);
  const [explainError, setExplainError] = useState(null);
  const explainAudioRef = useRef(null);

  // Flashcard state
  const [showFlashcards, setShowFlashcards]     = useState(false);
  const [flashcardsData, setFlashcardsData]     = useState(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcardsError, setFlashcardsError]   = useState(null);

  // Quiz state
  const [showQuiz, setShowQuiz]                 = useState(false);
  const [quizData, setQuizData]                 = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError]               = useState(null);

  // Images state
  const [showImages, setShowImages]             = useState(false);
  const [imagesData, setImagesData]             = useState(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imagesError, setImagesError]           = useState(null);

  // Insights states
  const [showInsights, setShowInsights] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  const chapterTitle = originalData?.chapter_title || topics[0]?.chapter || "Chapter Notes";

  // PDF export hook — receives mindmapCache and its setter so it can
  // populate the cache when generating mindmaps for the combined PDF
  const {
    isDownloadingChapter,
    isDownloadingChapterCombined,
    handleDownloadChapterPDF,
    handleDownloadChapterCombinedPDF,
  } = useExportPDF(simplifiedTopics, selectedLanguage, chapterTitle, mindmapCache, setMindmapCache);

  // Explain audio event listeners
  useEffect(() => {
    const audio = explainAudioRef.current;
    if (!audio) return;

    const updateTime  = () => setExplainCurrentTime(audio.currentTime);
    const updateDur   = () => setExplainDuration(audio.duration);
    const handleEnded = () => setIsExplainPlaying(false);

    audio.addEventListener("timeupdate",     updateTime);
    audio.addEventListener("loadedmetadata", updateDur);
    audio.addEventListener("ended",          handleEnded);

    return () => {
      audio.removeEventListener("timeupdate",     updateTime);
      audio.removeEventListener("loadedmetadata", updateDur);
      audio.removeEventListener("ended",          handleEnded);
    };
  }, [explainAudioLoaded]);

  // ── Simplify ──────────────────────────────────────────────────
  useEffect(() => {
    if (topics.length > 0 && !isProcessing) simplifyAllTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simplifyAllTopics = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsSimplifying(true);
    setSimplificationProgress(0);
    setSimplificationErrors({});

    const results = [];
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      try {
        const res = await api.simplifyText(topic.content);
        results.push({ ...topic, content: res.data.data, originalContent: topic.content, simplified: true, error: null });
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setSimplificationErrors((prev) => ({ ...prev, [i]: msg }));
        results.push({ ...topic, originalContent: topic.content, simplified: false, error: msg });
      }
      setSimplificationProgress(Math.round(((i + 1) / topics.length) * 100));
      setSimplifiedTopics([...results]);
      if (i < topics.length - 1) await delay(2000);
    }

    setIsSimplifying(false);
    if (selectedLanguage === "hindi") await translateAllTopics(results);
    else { setIsProcessing(false); if (results.length > 0) setSelectedTopic(results[0]); }
  };

  const translateAllTopics = async (topicsToTranslate) => {
    setIsTranslating(true);
    setTranslationProgress(0);
    const translated = [];
    for (let i = 0; i < topicsToTranslate.length; i++) {
      const t = topicsToTranslate[i];
      try {
        const [topicRes, contentRes] = await Promise.all([
          api.translateText(t.topic),
          api.translateText(t.content),
        ]);
        translated.push({
          ...t,
          topic_hindi: topicRes.data.data.translated_text,
          content_hindi: contentRes.data.data.translated_text,
          translated: true,
        });
      } catch {
        translated.push({ ...t, topic_hindi: t.topic, content_hindi: t.content, translated: false });
      }
      setTranslationProgress(Math.round(((i + 1) / topicsToTranslate.length) * 100));
      setSimplifiedTopics([...translated]);
      if (i < topicsToTranslate.length - 1) await delay(1500);
    }
    setIsTranslating(false);
    setIsProcessing(false);
    if (translated.length > 0) setSelectedTopic(translated[0]);
  };

  const retrySimplification = async (topicIndex) => {
    const topic = simplifiedTopics[topicIndex];
    if (!topic || !originalData) return;
    try {
      const res = await api.simplifyText(originalData[topicIndex].content);
      const updated = [...simplifiedTopics];
      updated[topicIndex] = { ...topic, content: res.data.data, simplified: true, error: null };
      setSimplifiedTopics(updated);
      setSimplificationErrors((prev) => { const n = { ...prev }; delete n[topicIndex]; return n; });
      if (selectedTopic?.topic === topic.topic) setSelectedTopic(updated[topicIndex]);
    } catch (err) {
      setSimplificationErrors((prev) => ({ ...prev, [topicIndex]: err.response?.data?.message || err.message }));
    }
  };

  const handleTopicClick = (topic) => {
    const idx = topics.findIndex((t) => t.topic === topic.topic);
    if (idx !== -1 && simplifiedTopics[idx]) setSelectedTopic(simplifiedTopics[idx]);
    else setSelectedTopic(topic);
  };

  // ── Mindmap — uses cache ──────────────────────────────────────
  const generateMindmap = async () => {
    if (!selectedTopic) return;
    setShowMindmap(true);
    setMindmapError(null);

    // Reset explain state when generating a new mindmap
    setExplainAudioLoaded(false);
    setIsExplainPlaying(false);
    setExplainCurrentTime(0);
    setExplainDuration(0);
    setExplainError(null);

    const cacheKey = selectedTopic.topic;

    // Hit cache first — no API call needed
    if (mindmapCache[cacheKey]) {
      setActiveMindmapData(mindmapCache[cacheKey]);
      return;
    }

    setIsGeneratingMindmap(true);
    try {
      const text = selectedLanguage === "hindi" && selectedTopic.content_hindi
        ? selectedTopic.content_hindi
        : selectedTopic.content;
      const res = await api.generateMindmap({ text });
      const data = res.data.data;
      // Store in cache
      setMindmapCache(prev => ({ ...prev, [cacheKey]: data }));
      setActiveMindmapData(data);
    } catch (err) {
      setMindmapError(err.response?.data?.message || err.message || "Failed to generate mindmap");
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  // Mindmap Explain
  const handleExplainMindmap = async () => {
    if (!activeMindmapData) return;

    setIsExplainingMindmap(true);
    setExplainError(null);
    setExplainAudioLoaded(false);
    setIsExplainPlaying(false);
    setExplainCurrentTime(0);
    setExplainDuration(0);

    // Stop any currently playing explain audio
    if (explainAudioRef.current) {
      explainAudioRef.current.pause();
    }

    try {
      const response = await api.explainMindmap(activeMindmapData);
      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl  = URL.createObjectURL(audioBlob);

      if (explainAudioRef.current) {
        explainAudioRef.current.src = audioUrl;
        explainAudioRef.current.load();
        setExplainAudioLoaded(true);
        explainAudioRef.current.play();
        setIsExplainPlaying(true);
      }
    } catch (err) {
      setExplainError(err.response?.data?.message || err.message || "Failed to generate explanation");
    } finally {
      setIsExplainingMindmap(false);
    }
  };

  const toggleExplainPlayPause = () => {
    if (!explainAudioRef.current) return;
    if (isExplainPlaying) {
      explainAudioRef.current.pause();
      setIsExplainPlaying(false);
    } else {
      explainAudioRef.current.play();
      setIsExplainPlaying(true);
    }
  };

  const handleExplainSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (explainAudioRef.current) {
      explainAudioRef.current.currentTime = newTime;
      setExplainCurrentTime(newTime);
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDownloadMindmapPDF = async () => {
    if (!selectedTopic || !activeMindmapData) return;
    setIsDownloadingMindmap(true);
    try {
      if (!window.go) { alert("GoJS not loaded."); return; }
      const div = document.getElementById("mindmap-canvas");
      const diagram = div ? window.go.Diagram.fromDiv(div) : null;
      if (!diagram) { alert("Mindmap not ready. Switch to Mind Map View first."); return; }
      const imageDataUrl = diagram.makeImageData({ background: "white", scale: 1 });
      if (!imageDataUrl?.startsWith("data:image")) { alert("Failed to generate mindmap image."); return; }
      const res = await api.exportMindmapPDF(selectedTopic.topic, imageDataUrl, "");
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${selectedTopic.topic}_mindmap.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e); alert("Failed to download Mindmap PDF.");
    } finally {
      setIsDownloadingMindmap(false);
    }
  };

  // ── Flashcards ────────────────────────────────────────────────
  const generateFlashcards = async () => {
    if (!selectedTopic) return;
    setIsGeneratingFlashcards(true);
    setFlashcardsError(null);
    setShowFlashcards(true);
    try {
      const text = selectedLanguage === "hindi" && selectedTopic.content_hindi
        ? selectedTopic.content_hindi : selectedTopic.content;
      const res = await api.generateFlashcards({ text });
      let fc = res.data.data;
      if (fc.flashcards) fc = fc.flashcards;
      setFlashcardsData(fc);
    } catch (err) {
      setFlashcardsError(err.response?.data?.message || err.message || "Failed to generate flashcards");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // ── Quiz ──────────────────────────────────────────────────────
  const generateQuiz = async () => {
    if (!selectedTopic) return;
    setIsGeneratingQuiz(true);
    setQuizError(null);
    setShowQuiz(true);
    try {
      const text = selectedLanguage === "hindi" && selectedTopic.content_hindi
        ? selectedTopic.content_hindi : selectedTopic.content;
      const res = await api.generateQuiz(selectedTopic.topic, text);
      setQuizData(res?.data?.data);
    } catch (err) {
      setQuizError(err.response?.data?.message || err.message || "Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // ── Images ────────────────────────────────────────────────────
  const generateImages = async () => {
    if (!selectedTopic) return;
    setIsGeneratingImages(true);
    setImagesError(null);
    setShowImages(true);
    try {
      const text = selectedLanguage === "hindi" && selectedTopic.content_hindi
        ? selectedTopic.content_hindi : selectedTopic.content;
      const res = await api.generateImages({ text });
      setImagesData(res.data.data.images);
    } catch (err) {
      setImagesError(err.response?.data?.message || err.message || "Failed to generate images");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // ── Insights ──────────────────────────────────────────────────
  const generateInsights = async () => {
    if (!selectedTopic) return;
    setIsGeneratingInsights(true);
    setInsightsError(null);
    setShowInsights(true);

    try {
      const content =
        selectedLanguage === "hindi" && selectedTopic.content_hindi
          ? selectedTopic.content_hindi
          : selectedTopic.content;

      const response = await api.generateInsights({ text: content });
      setInsightsData(response.data.data);
    } catch (err) {
      setInsightsError(err.response?.data?.message || err.message || "Failed to generate insights");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (!topics.length) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl text-gray-400 mb-4">No content available</p>
        <button onClick={onBack} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <audio ref={explainAudioRef} />
      <div id="hidden-mindmap-export" style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1200px", height: "900px", background: "white" }} />

      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-gray-700 rounded-lg transition">
                <ArrowLeft size={24} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📚</span>
              Learning Dashboard
              <span className="text-sm bg-blue-600 px-3 py-1 rounded-full">
                {selectedLanguage === "hindi" ? "हिंदी" : "English"}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadChapterPDF}
              disabled={isDownloadingChapter || isSimplifying || isTranslating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isDownloadingChapter ? "bg-green-700/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              {isDownloadingChapter ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
              Chapter Notes
            </button>

            <button
              onClick={handleDownloadChapterCombinedPDF}
              disabled={isDownloadingChapterCombined || isSimplifying || isTranslating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isDownloadingChapterCombined ? "bg-purple-700/50 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
              } text-white`}
            >
              {isDownloadingChapterCombined ? <Loader size={16} className="animate-spin" /> : <Layers size={16} />}
              Chapter + Mindmaps
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <TopicsSidebar
            topics={topics}
            simplifiedTopics={simplifiedTopics}
            selectedTopic={selectedTopic}
            selectedLanguage={selectedLanguage}
            onTopicClick={handleTopicClick}
          />

          <ContentPanel
            selectedTopic={selectedTopic}
            simplifiedTopics={simplifiedTopics}
            selectedLanguage={selectedLanguage}
            isSimplifying={isSimplifying}
            isTranslating={isTranslating}
            simplificationProgress={simplificationProgress}
            translationProgress={translationProgress}
            onRetrySimplification={retrySimplification}
          />

          <Studio
            selectedTopic={selectedTopic}
            isSimplifying={isSimplifying}
            isTranslating={isTranslating}
            onMindmap={generateMindmap}
            onFlashcards={generateFlashcards}
            onQuiz={generateQuiz}
            onImages={generateImages}
            onInsights={generateInsights}
          />
        </div>
      </main>

      {showMindmap && (
        <MindmapModal
          selectedTopic={selectedTopic}
          mindmapData={activeMindmapData}
          isGenerating={isGeneratingMindmap}
          error={mindmapError}
          onClose={() => {
            setShowMindmap(false);
            setActiveMindmapData(null);
            setMindmapError(null);
            // Stop & reset explain audio
            if (explainAudioRef.current) {
              explainAudioRef.current.pause();
            }
            setExplainAudioLoaded(false);
            setIsExplainPlaying(false);
            setExplainCurrentTime(0);
            setExplainDuration(0);
            setExplainError(null);
          }}
          onRetry={generateMindmap}
          onDownloadPDF={handleDownloadMindmapPDF}
          isDownloadingPDF={isDownloadingMindmap}
          // Explain audio props
          onExplainMindmap={handleExplainMindmap}
          isExplainingMindmap={isExplainingMindmap}
          explainAudioLoaded={explainAudioLoaded}
          explainError={explainError}
          isExplainPlaying={isExplainPlaying}
          explainCurrentTime={explainCurrentTime}
          explainDuration={explainDuration}
          onToggleExplainPlayPause={toggleExplainPlayPause}
          onExplainSeek={handleExplainSeek}
          formatTime={formatTime}
        />
      )}

      {showFlashcards && (
        <FlashcardModal
          flashcards={flashcardsData}
          isLoading={isGeneratingFlashcards}
          error={flashcardsError}
          topicName={selectedTopic?.topic}
          selectedLanguage={selectedLanguage}
          onClose={() => { setShowFlashcards(false); setFlashcardsData(null); setFlashcardsError(null); }}
          onRetry={generateFlashcards}
        />
      )}

      {showQuiz && (
        <QuizModal
          quizData={quizData}
          isLoading={isGeneratingQuiz}
          error={quizError}
          onClose={() => { setShowQuiz(false); setQuizData(null); setQuizError(null); }}
        />
      )}

      {showImages && (
        <ImagesModal
          selectedTopic={selectedTopic}
          imagesData={imagesData}
          isLoading={isGeneratingImages}
          error={imagesError}
          onClose={() => { setShowImages(false); setImagesData(null); setImagesError(null); }}
          onRetry={generateImages}
        />
      )}

      {showInsights && (
        <InsightsModal
          data={insightsData}
          isLoading={isGeneratingInsights}
          error={insightsError}
          topicName={selectedTopic?.topic}
          onClose={() => { setShowInsights(false); setInsightsData(null); setInsightsError(null); }}
          onRetry={generateInsights}
        />
      )}
    </div>
  );
};

export default Output;