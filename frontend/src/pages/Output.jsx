import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, X, Loader } from 'lucide-react';
import * as api from '../services/api';

const Output = ({ extractedData, originalData, onBack }) => {
  const topics = Array.isArray(extractedData) ? extractedData : [];
  
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [simplifiedTopics, setSimplifiedTopics] = useState([]);
  const [simplificationProgress, setSimplificationProgress] = useState(0);
  const [isSimplifying, setIsSimplifying] = useState(true);
  const [simplificationErrors, setSimplificationErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Mindmap states
  const [showMindmap, setShowMindmap] = useState(false);
  const [mindmapData, setMindmapData] = useState(null);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [mindmapError, setMindmapError] = useState(null);

  useEffect(() => {
    if (topics.length > 0 && !isProcessing) {
      simplifyAllTopics();
    }
  }, []);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const simplifyAllTopics = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setIsSimplifying(true);
    setSimplificationProgress(0);
    setSimplificationErrors({});
    
    const totalTopics = topics.length;
    const results = [];
    
    for (let index = 0; index < topics.length; index++) {
      const topic = topics[index];
      
      try {
        const response = await api.simplifyText(topic.content);
        
        results.push({
          ...topic,
          content: response.data.data,
          originalContent: topic.content,
          simplified: true,
          error: null
        });
        
        setSimplificationProgress(Math.round(((index + 1) / totalTopics) * 100));
        
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        
        setSimplificationErrors(prev => ({
          ...prev,
          [index]: errorMsg
        }));
        
        results.push({
          ...topic,
          originalContent: topic.content,
          simplified: false,
          error: errorMsg
        });
        
        setSimplificationProgress(Math.round(((index + 1) / totalTopics) * 100));
      }
      
      setSimplifiedTopics([...results]);
      
      if (index < topics.length - 1) {
        await delay(2000);
      }
    }
    
    setIsSimplifying(false);
    setIsProcessing(false);
    
    if (results.length > 0) {
      setSelectedTopic(results[0]);
    }
  };

  const retrySimplification = async (topicIndex) => {
    const topic = simplifiedTopics[topicIndex];
    if (!topic || !originalData) return;

    try {
      const response = await api.simplifyText(originalData[topicIndex].content);
      
      const updatedTopics = [...simplifiedTopics];
      updatedTopics[topicIndex] = {
        ...topic,
        content: response.data.data,
        simplified: true,
        error: null
      };
      
      setSimplifiedTopics(updatedTopics);
      
      setSimplificationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[topicIndex];
        return newErrors;
      });
      
      if (selectedTopic === topic) {
        setSelectedTopic(updatedTopics[topicIndex]);
      }
    } catch (err) {
      setSimplificationErrors(prev => ({
        ...prev,
        [topicIndex]: err.response?.data?.message || err.message
      }));
    }
  };

  const handleTopicClick = (topic) => {
    const topicIndex = topics.findIndex(t => t.topic === topic.topic);
    if (topicIndex !== -1 && simplifiedTopics[topicIndex]) {
      setSelectedTopic(simplifiedTopics[topicIndex]);
    } else {
      setSelectedTopic(topic);
    }
  };

  const generateMindmap = async () => {
    if (!selectedTopic) return;
    
    setIsGeneratingMindmap(true);
    setMindmapError(null);
    setShowMindmap(true);
    
    try {
      const response = await api.generateMindmap({
        text: selectedTopic.content
      });
      
      setMindmapData(response.data.data);
    } catch (err) {
      setMindmapError(err.response?.data?.message || err.message || 'Failed to generate mindmap');
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  const closeMindmap = () => {
    setShowMindmap(false);
    setMindmapData(null);
    setMindmapError(null);
  };

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

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
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
                    selectedTopic && selectedTopic.topic === topic.topic
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

          <section className="flex-1 bg-gray-800 rounded-xl shadow-md p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
            {isSimplifying ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-full max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-medium">Simplifying topics...</span>
                    <span className="text-blue-400 font-semibold">{simplificationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${simplificationProgress}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-3 text-center">
                    {Math.round((simplificationProgress / 100) * topics.length)} of {topics.length} topics completed
                    <br />
                    <span className="text-xs text-gray-500">Processing one topic every 2 seconds...</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-blue-500" />
                  <span>Please wait...</span>
                </div>
              </div>
            ) : selectedTopic ? (
              <div className="bg-gray-750 rounded-lg p-6 shadow-inner">
                <h2 className="text-2xl font-bold mb-4 text-blue-300 border-b border-gray-600 pb-3">
                  {selectedTopic.topic}
                </h2>
                
                {selectedTopic.error ? (
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-300 mb-3">
                      Error simplifying this topic: {selectedTopic.error}
                    </p>
                    <button
                      onClick={() => {
                        const topicIndex = simplifiedTopics.findIndex(t => t.topic === selectedTopic.topic);
                        if (topicIndex !== -1) retrySimplification(topicIndex);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      <RefreshCw size={16} />
                      Retry Simplification
                    </button>
                    {selectedTopic.originalContent && (
                      <div className="mt-4 pt-4 border-t border-red-500/30">
                        <p className="text-gray-400 text-sm mb-2">Showing original content:</p>
                        <div className="prose prose-invert max-w-none">
                          <p className="text-gray-200 leading-relaxed text-base whitespace-pre-wrap">
                            {selectedTopic.originalContent}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 leading-relaxed text-base whitespace-pre-wrap">
                      {selectedTopic.content}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-lg">Select a topic to view content</p>
              </div>
            )}
          </section>

          <aside className="w-full lg:w-1/4 bg-gray-800 rounded-xl shadow-md p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-green-400 border-b border-gray-700 pb-2">
              Studio
            </h2>
            <div className="space-y-3">
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
                title="Coming soon"
              >
                <span className="text-2xl">🎵</span>
                <span className="font-medium">Audio Overview</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
                title="Coming soon"
              >
                <span className="text-2xl">🎥</span>
                <span className="font-medium">Video Overview</span>
              </button>
              <button
                onClick={generateMindmap}
                disabled={!selectedTopic || isSimplifying}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  selectedTopic && !isSimplifying
                    ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                title={selectedTopic ? 'Generate Mind Map' : 'Select a topic first'}
              >
                <span className="text-2xl">🗺️</span>
                <span className="font-medium">Mind Map</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
                title="Coming soon"
              >
                <span className="text-2xl">📊</span>
                <span className="font-medium">Reports</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
                title="Coming soon"
              >
                <span className="text-2xl">🗂️</span>
                <span className="font-medium">Flashcards</span>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
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

      {/* Mindmap Modal */}
      {showMindmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                Mind Map: {selectedTopic?.topic}
              </h3>
              <button
                onClick={closeMindmap}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
                title="Close"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {isGeneratingMindmap ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Loader size={48} className="animate-spin text-purple-500" />
                  <p className="text-gray-300 text-lg">Generating your mind map...</p>
                  <p className="text-gray-500 text-sm">This may take a few moments</p>
                </div>
              ) : mindmapError ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
                    <p className="text-red-300 text-center mb-4">
                      Failed to generate mind map: {mindmapError}
                    </p>
                    <button
                      onClick={generateMindmap}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      <RefreshCw size={16} />
                      Retry
                    </button>
                  </div>
                </div>
              ) : mindmapData ? (
                <div className="bg-white rounded-lg p-4 h-full min-h-[600px]">
                  <MindmapRenderer data={mindmapData} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mindmap Renderer Component
const MindmapRenderer = ({ data }) => {
  useEffect(() => {
    if (!data || !window.go) return;

    const $ = window.go.GraphObject.make;

    const diagram = $(window.go.Diagram, 'mindmap-canvas', {
      layout: $(window.go.TreeLayout, {
        angle: 0,
        layerSpacing: 80,
        nodeSpacing: 40,
        arrangement: window.go.TreeLayout.ArrangementHorizontal
      }),
      'undoManager.isEnabled': true,
      initialAutoScale: window.go.Diagram.Uniform,
      contentAlignment: window.go.Spot.Center,
      padding: 30
    });

    diagram.nodeTemplate = $(
      window.go.Node,
      'Auto',
      {
        selectionAdorned: true,
        shadowVisible: true,
        shadowColor: '#00000033',
        shadowOffset: new window.go.Point(0, 3),
        shadowBlur: 8
      },
      $(
        window.go.Shape,
        'RoundedRectangle',
        {
          strokeWidth: 0,
          fill: 'lightblue',
          portId: '',
          cursor: 'pointer'
        },
        new window.go.Binding('fill', 'color')
      ),
      $(
        window.go.Panel,
        'Horizontal',
        { margin: 12 },
        $(
          window.go.TextBlock,
          {
            font: 'bold 20px sans-serif',
            margin: new window.go.Margin(0, 8, 0, 0),
            stroke: 'white'
          },
          new window.go.Binding('text', 'emoji')
        ),
        $(
          window.go.TextBlock,
          {
            font: 'bold 14px sans-serif',
            stroke: 'white',
            maxSize: new window.go.Size(180, NaN),
            wrap: window.go.TextBlock.WrapFit,
            textAlign: 'center'
          },
          new window.go.Binding('text', 'text')
        )
      )
    );

    diagram.linkTemplate = $(
      window.go.Link,
      {
        routing: window.go.Link.Orthogonal,
        corner: 10,
        curve: window.go.Link.JumpOver
      },
      $(window.go.Shape, { strokeWidth: 3, stroke: '#a0a0a0' })
    );

    diagram.model = new window.go.GraphLinksModel(
      data.nodes || [],
      data.links || []
    );

    return () => {
      diagram.div = null;
    };
  }, [data]);

  return (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gojs/2.3.11/go.js"></script>
      <div id="mindmap-canvas" className="w-full h-full min-h-[550px]" />
    </>
  );
};

export default Output;