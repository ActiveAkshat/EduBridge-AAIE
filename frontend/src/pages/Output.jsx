import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const Output = ({ extractedData, onBack }) => {
  // Parse the extracted data - it should be an array of topics from the API
  const topics = Array.isArray(extractedData) ? extractedData : [];
  
  const [selectedTopic, setSelectedTopic] = useState(topics[0] || null);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
  };

  // If no data is available
  if (!topics || topics.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">No content available</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
                title="Go back"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📚</span>
              Learning Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content - Three Panel Layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Topics */}
          <aside className="w-full lg:w-1/4 bg-gray-800 rounded-xl shadow-md p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-blue-400 border-b border-gray-700 pb-2">
              Topics ({topics.length})
            </h2>
            <nav className="space-y-2">
              {topics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTopicClick(topic)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                    selectedTopic === topic
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  <span className="font-medium text-sm leading-tight">
                    {topic.topic || `Topic ${index + 1}`}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Middle Panel - Content */}
          <section className="flex-1 bg-gray-800 rounded-xl shadow-md p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
            {selectedTopic ? (
              <div className="bg-gray-750 rounded-lg p-6 shadow-inner">
                <h2 className="text-2xl font-bold mb-4 text-blue-300 border-b border-gray-600 pb-3">
                  {selectedTopic.topic}
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-200 leading-relaxed text-base whitespace-pre-wrap">
                    {selectedTopic.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-lg">Select a topic to view content</p>
              </div>
            )}
          </section>

          {/* Right Panel - Studio Tools (Disabled for now) */}
          <aside className="w-full lg:w-1/4 bg-gray-800 rounded-xl shadow-md p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-green-400 border-b border-gray-700 pb-2">
              Studio
            </h2>
            <div className="space-y-3">
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed opacity-50"
                title="Coming soon"
              >
                <span className="text-2xl">🎵</span>
                <span className="font-medium">Audio Overview</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed opacity-50"
                title="Coming soon"
              >
                <span className="text-2xl">🎥</span>
                <span className="font-medium">Video Overview</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed opacity-50"
                title="Coming soon"
              >
                <span className="text-2xl">🗺️</span>
                <span className="font-medium">Mind Map</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed opacity-50"
                title="Coming soon"
              >
                <span className="text-2xl">📊</span>
                <span className="font-medium">Reports</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed opacity-50"
                title="Coming soon"
              >
                <span className="text-2xl">🗂️</span>
                <span className="font-medium">Flashcards</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed opacity-50"
                title="Coming soon"
              >
                <span className="text-2xl">❓</span>
                <span className="font-medium">Quiz</span>
              </button>
            </div>
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm text-center">
                Additional tools coming soon!
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Output;