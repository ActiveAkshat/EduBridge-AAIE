import React, { useState, useRef } from "react";
import { ArrowRight, Upload, Loader, Globe, GraduationCap } from "lucide-react";
import * as api from "../services/api";
import Output from "./Output";

// Auto-suggest learning level based on grade
function suggestLevel(grade) {
  const g = parseInt(grade);
  if (!g) return "beginner";
  if (g <= 5) return "beginner";
  if (g <= 8) return "intermediate";
  return "advanced";
}

function Home() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  // NEW: learner profile state
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [learningLevel, setLearningLevel] = useState("beginner");
  const [levelManuallySet, setLevelManuallySet] = useState(false);

  const fileRef = useRef(null);

  // Auto-update learning level when grade changes (unless user manually set it)
  const handleGradeChange = (e) => {
    const val = e.target.value;
    setGrade(val);
    if (!levelManuallySet) {
      setLearningLevel(suggestLevel(val));
    }
  };

  const handleLevelChange = (e) => {
    setLearningLevel(e.target.value);
    setLevelManuallySet(true);
  };

  // Build learner profile object to pass to API
  const getLearnerProfile = () => ({
    age: age || null,
    grade: grade || null,
    learningLevel,
    language: selectedLanguage,
  });

  const handleProcessText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.extractText(text, getLearnerProfile());
      const topics = response.data.data;
      setOriginalData(topics);
      setExtractedData(topics);
      setShowOutput(true);
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
      const response = await api.uploadPDF(file, getLearnerProfile());
      const topics = response.data.data;
      setOriginalData(topics);
      setExtractedData(topics);
      setShowOutput(true);
    } catch (err) {
      setError("Error uploading PDF: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleBack = () => {
    setShowOutput(false);
    setExtractedData(null);
    setOriginalData(null);
    setFile(null);
    setText("");
    setError(null);
    setSelectedLanguage("english");
    setAge("");
    setGrade("");
    setLearningLevel("beginner");
    setLevelManuallySet(false);
  };

  const onPickFile = () => fileRef.current?.click();
  const onFileChange = (e) => setFile(e.target.files?.[0] ?? null);

  const isActive = text.trim() !== "" || file !== null;

  const levelStyles = {
    beginner:     { dot: "bg-green-400",  label: "text-green-400",  ring: "focus:ring-green-500",  border: "border-green-600"  },
    intermediate: { dot: "bg-yellow-400", label: "text-yellow-400", ring: "focus:ring-yellow-500", border: "border-yellow-600" },
    advanced:     { dot: "bg-red-400",    label: "text-red-400",    ring: "focus:ring-red-500",    border: "border-red-600"    },
  };
  const ls = levelStyles[learningLevel];

  if (showOutput && extractedData) {
    return (
      <Output
        extractedData={extractedData}
        originalData={originalData}
        onBack={handleBack}
        selectedLanguage={selectedLanguage}
        learnerProfile={getLearnerProfile()}
      />
    );
  }

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

      {/* ── Learner Profile Card ── */}
      <div className="w-full max-w-3xl mb-4 bg-stone-900 rounded-xl border border-stone-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="text-sky-400" size={20} />
          <span className="text-white font-medium text-sm">Learner Profile</span>
          <span className="ml-auto text-xs text-stone-500">Helps us personalise the explanation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Age */}
          <div className="flex flex-col gap-1">
            <label className="text-stone-400 text-xs font-medium uppercase tracking-wide">Age</label>
            <input
              type="number"
              min={5}
              max={25}
              placeholder="e.g. 14"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="bg-stone-800 text-white px-3 py-2 rounded-lg border border-stone-600 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-stone-500 text-sm"
            />
          </div>

          {/* Grade */}
          <div className="flex flex-col gap-1">
            <label className="text-stone-400 text-xs font-medium uppercase tracking-wide">Grade / Class</label>
            <input
              type="number"
              min={1}
              max={12}
              placeholder="e.g. 9"
              value={grade}
              onChange={handleGradeChange}
              className="bg-stone-800 text-white px-3 py-2 rounded-lg border border-stone-600 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-stone-500 text-sm"
            />
          </div>

          {/* Learning Level */}
          <div className="flex flex-col gap-1">
            <label className="text-stone-400 text-xs font-medium uppercase tracking-wide">
              Learning Level
              {!levelManuallySet && grade && (
                <span className="ml-1 text-sky-500 normal-case">(auto)</span>
              )}
            </label>
            <div className={`relative bg-stone-800 rounded-lg border ${ls.border}`}>
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${ls.dot}`} />
              <select
                value={learningLevel}
                onChange={handleLevelChange}
                className={`w-full bg-transparent text-white pl-7 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${ls.ring} text-sm cursor-pointer appearance-none`}
              >
                <option value="beginner">🟢 Beginner</option>
                <option value="intermediate">🟡 Intermediate</option>
                <option value="advanced">🔴 Advanced</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Language Selector */}
      <div className="w-full max-w-3xl mb-4">
        <div className="flex items-center gap-3 bg-stone-900 rounded-xl p-4 border border-stone-700">
          <Globe className="text-sky-400" size={20} />
          <label className="text-white font-medium text-sm">Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="flex-1 bg-stone-800 text-white px-4 py-2 rounded-lg border border-stone-600 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer text-sm"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi (हिंदी)</option>
          </select>
        </div>
      </div>

      {/* Text input */}
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
          className="absolute bottom-3 right-3 p-2 rounded-full transition duration-200 z-10"
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

      {/* PDF upload */}
      <div
        className="w-full max-w-3xl border-2 border-dashed border-stone-700 rounded-xl p-8 hover:border-sky-500 hover:bg-stone-900/50 transition-all duration-300 cursor-pointer text-center flex flex-col items-center justify-center space-y-3"
        onClick={onPickFile}
      >
        <Upload className="text-sky-400 w-8 h-8" />
        <p className="text-white text-base font-medium">
          {file ? (
            <><span className="text-sky-400">✓ {file.name}</span> ready to upload</>
          ) : (
            "Drag and drop your PDF here or click to upload"
          )}
        </p>
        <p className="text-gray-500 text-sm">PDF files only, up to 50MB</p>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
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

export default Home;