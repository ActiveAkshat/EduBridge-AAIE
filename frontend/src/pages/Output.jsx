import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Layers, Loader } from "lucide-react";
import * as api from "../services/api";

import TopicsSidebar  from "./output/TopicsSidebar";
import ContentPanel   from "./output/ContentPanel";
import Studio         from "./output/Studio";
import MindmapModal   from "./output/MindmapModal";
import FlashcardModal from "./output/FlashcardModal";
import QuizModal      from "./output/QuizModal";
import ImagesModal    from "./output/ImagesModal";
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

  const chapterTitle = originalData?.chapter_title || topics[0]?.chapter || "Chapter Notes";

  // PDF export hook — receives mindmapCache and its setter so it can
  // populate the cache when generating mindmaps for the combined PDF
  const {
    isDownloadingChapter,
    isDownloadingChapterCombined,
    handleDownloadChapterPDF,
    handleDownloadChapterCombinedPDF,
  } = useExportPDF(simplifiedTopics, selectedLanguage, chapterTitle, mindmapCache, setMindmapCache);

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
          />
        </div>
      </main>

      {showMindmap && (
        <MindmapModal
          selectedTopic={selectedTopic}
          mindmapData={activeMindmapData}
          isGenerating={isGeneratingMindmap}
          error={mindmapError}
          onClose={() => { setShowMindmap(false); setActiveMindmapData(null); setMindmapError(null); }}
          onRetry={generateMindmap}
          onDownloadPDF={handleDownloadMindmapPDF}
          isDownloadingPDF={isDownloadingMindmap}
        />
      )}

      {showFlashcards && (
        <FlashcardModal
          flashcards={flashcardsData}
          isLoading={isGeneratingFlashcards}
          error={flashcardsError}
          topicName={selectedTopic?.topic}
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
    </div>
  );
};

export default Output;