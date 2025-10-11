import React, { useState, useRef } from "react";
import { ArrowRight, Upload, Loader, X, BookOpen, Brain, Lightbulb } from "lucide-react";
import * as api from "../services/api";

function Home() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [originalText, setOriginalText] = useState(""); // Store original text for services
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleProcessText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setOriginalText(text); // Save original text
    try {
      const response = await api.extractText(text);
      setResult(response.data.data);
      setCurrentTab("extract");
    } catch (err) {
      setError("Error processing text: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleUploadPDF = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.uploadPDF(file);
      setResult(response.data.data);
      // Extract text from the response if available
      if (response.data.data && typeof response.data.data === 'object') {
        const textContent = response.data.data.text || JSON.stringify(response.data.data);
        setOriginalText(textContent);
      }
      setCurrentTab("extract");
    } catch (err) {
      setError("Error uploading PDF: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleSimplify = async () => {
    setLoading(true);
    setError(null);
    if (!originalText.trim()) {
      setError("No text available to simplify");
      setLoading(false);
      return;
    }
    try {
      const response = await api.simplifyText(originalText);
      setResult(response.data.data);
      setCurrentTab("simplify");
    } catch (err) {
      setError("Error simplifying text: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleGenerateMindmap = async () => {
    setLoading(true);
    setError(null);
    if (!originalText.trim()) {
      setError("No text available for mind map");
      setLoading(false);
      return;
    }
    try {
      const response = await api.generateMindmap(originalText);
      setResult(response.data.data);
      setCurrentTab("mindmap");
    } catch (err) {
      setError("Error generating mind map: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleGenerateFlashcards = async () => {
    setLoading(true);
    setError(null);
    if (!originalText.trim()) {
      setError("No text available for flashcards");
      setLoading(false);
      return;
    }
    try {
      const response = await api.generateFlashcards(originalText);
      setResult(response.data.data);
      setCurrentTab("flashcards");
    } catch (err) {
      setError("Error generating flashcards: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const onPickFile = () => fileRef.current?.click();
  const onFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const resetAll = () => {
    setFile(null);
    setText("");
    setResult(null);
    setCurrentTab(null);
    setError(null);
  };

  const isActive = text.trim() !== "" || file !== null;

  // Initial State - Upload/Input Screen
  if (!result && !currentTab) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-950 px-6 overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white text-center mb-3">
          What'd you like to learn today?
        </h1>
        <p className="text-gray-400 text-center mb-12 max-w-2xl">
          Upload a PDF or paste your notes. We'll help you extract, simplify, and understand the content better.
        </p>

        {error && (
          <div className="w-full max-w-3xl mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <div className="relative w-full max-w-3xl mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text or notes here..."
            className="w-full h-24 p-4 pr-14 rounded-xl bg-stone-900 text-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 hover:bg-stone-800/80 transition-all duration-300 placeholder-gray-500"
          />
          <button
            onClick={handleProcessText}
            disabled={!text.trim() || loading}
            className="absolute bottom-3 right-3 rounded-full transition duration-200 z-10"
            style={
              isActive && text.trim()
                ? { backgroundColor: "white" }
                : { backgroundColor: "#0ea5e9" }
            }
          >
            {loading ? (
              <Loader size={20} className="animate-spin" color="#1e1e1e" />
            ) : (
              <ArrowRight size={20} color={isActive && text.trim() ? "#1e1e1e" : "white"} />
            )}
          </button>
        </div>

        <div className="w-full max-w-3xl text-center text-gray-400 mb-6">or</div>

        <div
          className="w-full max-w-3xl border-2 border-dashed border-stone-700 rounded-xl p-8 hover:border-sky-500 hover:bg-stone-900/50 transition-all duration-300 cursor-pointer text-center flex flex-col items-center justify-center space-y-3"
          onClick={onPickFile}
        >
          <Upload className="text-sky-400 w-8 h-8" />
          <p className="text-white text-base font-medium">
            {file ? (
              <>
                <span className="text-sky-400">✓ {file.name}</span> ready to upload
              </>
            ) : (
              "Drag and drop your PDF here or click to upload"
            )}
          </p>
          <p className="text-gray-500 text-sm">PDF files only, up to 50MB</p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {file && (
          <button
            onClick={handleUploadPDF}
            disabled={loading}
            className="mt-6 px-8 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg font-medium transition duration-200"
          >
            {loading ? "Processing..." : "Process PDF"}
          </button>
        )}
      </div>
    );
  }

  // Results Screen - Show extracted content with service buttons
  return (
    <div className="min-h-screen w-full bg-gray-950 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Learning Dashboard</h1>
          <button
            onClick={resetAll}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition duration-200"
          >
            <X size={20} />
            <span>Start Over</span>
          </button>
        </div>

        {error && (
          <div className="w-full mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Service Buttons */}
          <div className="lg:col-span-1">
            <div className="bg-stone-900 rounded-xl p-6 sticky top-8">
              <h2 className="text-white font-bold text-lg mb-4">Available Services</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentTab("extract")}
                  disabled={loading}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                    currentTab === "extract"
                      ? "bg-sky-500 text-white"
                      : "bg-white text-gray-900 hover:bg-gray-100"
                  } disabled:opacity-50`}
                >
                  <BookOpen size={20} />
                  <span className="font-medium">Extract Topics</span>
                </button>

                <button
                  onClick={handleSimplify}
                  disabled={loading}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                    currentTab === "simplify"
                      ? "bg-sky-500 text-white"
                      : "bg-white text-gray-900 hover:bg-gray-100"
                  } disabled:opacity-50`}
                >
                  {loading && currentTab === "simplify" ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    <Lightbulb size={20} />
                  )}
                  <span className="font-medium">Simplify</span>
                </button>

                <button
                  onClick={handleGenerateMindmap}
                  disabled={loading}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                    currentTab === "mindmap"
                      ? "bg-sky-500 text-white"
                      : "bg-white text-gray-900 hover:bg-gray-100"
                  } disabled:opacity-50`}
                >
                  {loading && currentTab === "mindmap" ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    <Brain size={20} />
                  )}
                  <span className="font-medium">Mind Map</span>
                </button>

                <button
                  onClick={handleGenerateFlashcards}
                  disabled={loading}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                    currentTab === "flashcards"
                      ? "bg-sky-500 text-white"
                      : "bg-white text-gray-900 hover:bg-gray-100"
                  } disabled:opacity-50`}
                >
                  {loading && currentTab === "flashcards" ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    <BookOpen size={20} />
                  )}
                  <span className="font-medium">Flashcards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-stone-900 rounded-xl p-12 flex flex-col items-center justify-center min-h-96">
                <Loader size={48} className="animate-spin text-sky-500 mb-4" />
                <p className="text-gray-300 text-lg">Processing your request...</p>
              </div>
            ) : currentTab === "extract" ? (
              <ExtractView result={result} />
            ) : currentTab === "simplify" ? (
              <SimplifyView result={result} />
            ) : currentTab === "mindmap" ? (
              <MindmapView result={result} />
            ) : currentTab === "flashcards" ? (
              <FlashcardsView result={result} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// View Components
function ExtractView({ result }) {
  return (
    <div className="bg-stone-900 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Extracted Topics</h2>
      {Array.isArray(result) ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {result.map((item, idx) => (
            <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sky-400 font-bold mb-2">{item.topic || item.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <pre className="text-gray-300 bg-gray-950 p-4 rounded overflow-auto max-h-96 text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

function SimplifyView({ result }) {
  return (
    <div className="bg-stone-900 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Simplified Content</h2>
      <div className="bg-gray-950 p-6 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result}</p>
      </div>
    </div>
  );
}

function MindmapView({ result }) {
  return (
    <div className="bg-stone-900 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Mind Map Structure</h2>
      <div className="bg-gray-950 p-6 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-sky-400 font-bold mb-3">Nodes:</h3>
            <div className="grid grid-cols-1 gap-2">
              {result.nodes?.map((node, idx) => (
                <div key={idx} className="text-gray-300 text-sm flex items-start space-x-2">
                  <span>{node.emoji}</span>
                  <div>
                    <span className="font-medium">{node.text}</span>
                    <p className="text-gray-500">{node.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sky-400 font-bold mb-3">Connections:</h3>
            <div className="space-y-1">
              {result.links?.map((link, idx) => (
                <div key={idx} className="text-gray-400 text-sm">
                  {link.from} → {link.to}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashcardsView({ result }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const cards = Array.isArray(result) ? result : result.flashcards || [];

  if (cards.length === 0) {
    return (
      <div className="bg-stone-900 rounded-xl p-8">
        <p className="text-gray-300">No flashcards available</p>
      </div>
    );
  }

  return (
    <div className="bg-stone-900 rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Flashcards</h2>
        <span className="text-gray-400">
          {currentCard + 1} / {cards.length}
        </span>
      </div>

      <div
        className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-8 min-h-64 flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 transform hover:scale-105"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <p className="text-gray-200 text-sm font-medium mb-4">{isFlipped ? "Answer" : "Question"}</p>
        <p className="text-white text-2xl font-bold text-center">
          {isFlipped ? cards[currentCard].answer : cards[currentCard].question}
        </p>
        <p className="text-blue-100 text-sm mt-6">Click to flip</p>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => {
            setCurrentCard(Math.max(0, currentCard - 1));
            setIsFlipped(false);
          }}
          disabled={currentCard === 0}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition"
        >
          Previous
        </button>
        <div className="flex gap-1">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentCard(idx);
                setIsFlipped(false);
              }}
              className={`w-2 h-2 rounded-full transition ${
                idx === currentCard ? "bg-sky-500" : "bg-gray-700"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => {
            setCurrentCard(Math.min(cards.length - 1, currentCard + 1));
            setIsFlipped(false);
          }}
          disabled={currentCard === cards.length - 1}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Home;