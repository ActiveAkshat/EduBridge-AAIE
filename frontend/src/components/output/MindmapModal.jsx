import { useState, useEffect } from "react";
import { X, Download, Loader } from "lucide-react";
import * as api from "../../services/api";

// ── Concept Cards ──────────────────────────────────────────────
const ConceptCardsView = ({ nodes }) => {
  if (!nodes?.length) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400">No concept cards available</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
      {nodes.map((node, idx) => (
        <div
          key={idx}
          className="rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${node.color || "#4299e1"}ee, ${node.color || "#4299e1"})`, color: "white" }}
        >
          <div className="text-4xl mb-3">{node.emoji || "📌"}</div>
          <h3 className="text-xl font-bold mb-2">{node.text || "N/A"}</h3>
          <p className="text-sm opacity-95 leading-relaxed">{node.description || "No description available"}</p>
        </div>
      ))}
    </div>
  );
};

// ── Mindmap Renderer ───────────────────────────────────────────
const MindmapRenderer = ({ data }) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!data || !window.go) return;
    const $ = window.go.GraphObject.make;
    const diagram = $(window.go.Diagram, "mindmap-canvas", {
      layout: $(window.go.TreeLayout, {
        angle: 0, layerSpacing: 80, nodeSpacing: 40,
        arrangement: window.go.TreeLayout.ArrangementHorizontal,
      }),
      initialAutoScale: window.go.Diagram.Uniform,
      contentAlignment: window.go.Spot.Center,
      padding: 30,
    });

    diagram.nodeTemplate = $(window.go.Node, "Auto",
      {
        mouseEnter: (e, node) => {
          const nd = node.data;
          if (nd?.description) {
            const vp = e.diagram.transformDocToView(e.diagram.lastInput.documentPoint);
            setTooltipPos({ x: vp.x + 20, y: vp.y - 10 });
            setHoveredNode(nd);
          }
        },
        mouseLeave: () => setHoveredNode(null),
      },
      $(window.go.Shape, "RoundedRectangle",
        { strokeWidth: 2, stroke: "#4b5563", fill: "lightblue", cursor: "pointer" },
        new window.go.Binding("fill", "color")
      ),
      $(window.go.Panel, "Horizontal", { margin: 14 },
        $(window.go.TextBlock,
          { font: "bold 22px sans-serif", margin: new window.go.Margin(0, 10, 0, 0), stroke: "white" },
          new window.go.Binding("text", "emoji")
        ),
        $(window.go.TextBlock,
          { font: "bold 15px sans-serif", stroke: "white", maxSize: new window.go.Size(200, NaN), wrap: window.go.TextBlock.WrapFit, textAlign: "center" },
          new window.go.Binding("text", "text")
        )
      )
    );

    diagram.linkTemplate = $(window.go.Link,
      { routing: window.go.Link.Orthogonal, corner: 12, curve: window.go.Link.JumpOver },
      $(window.go.Shape, { strokeWidth: 3, stroke: "#6b7280" })
    );

    diagram.model = new window.go.GraphLinksModel(data.nodes || [], data.links || []);
    return () => { diagram.div = null; };
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <div id="mindmap-canvas" className="w-full h-full min-h-[550px]" />
      {hoveredNode?.description && (
        <div className="absolute z-50 pointer-events-none"
          style={{ left: tooltipPos.x, top: tooltipPos.y, transform: "translate(0, -100%)" }}>
          <div className="bg-gray-900 border-2 border-blue-500 rounded-lg shadow-2xl p-3 max-w-xs">
            <p className="text-white text-sm leading-relaxed">{hoveredNode.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Modal ──────────────────────────────────────────────────────
const MindmapModal = ({ selectedTopic, mindmapData, isGenerating, error, onClose, onRetry, onDownloadPDF, isDownloadingPDF }) => {
  const [showConceptCards, setShowConceptCards] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            Mind Map: {selectedTopic?.topic}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {!isGenerating && !error && mindmapData && (
          <div className="flex gap-2 px-4 pt-4 border-b border-gray-700">
            <button
              onClick={() => setShowConceptCards(false)}
              className={`px-4 py-2 rounded-t-lg transition ${!showConceptCards ? "bg-gray-700 text-white" : "bg-gray-900 text-gray-400 hover:text-white"}`}
            >
              Mind Map View
            </button>
            <button
              onClick={() => setShowConceptCards(true)}
              className={`px-4 py-2 rounded-t-lg transition ${showConceptCards ? "bg-gray-700 text-white" : "bg-gray-900 text-gray-400 hover:text-white"}`}
            >
              📚 Concept Cards
            </button>
            <button
              onClick={onDownloadPDF}
              disabled={isDownloadingPDF}
              className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
                isDownloadingPDF ? "bg-purple-700/50 text-white cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {isDownloadingPDF ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader size={48} className="animate-spin text-purple-500" />
              <p className="text-gray-300 text-lg">Generating your mind map...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
                <p className="text-red-300 text-center mb-4">Failed to generate mind map: {error}</p>
                <button onClick={onRetry} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                  Retry
                </button>
              </div>
            </div>
          ) : mindmapData ? (
            showConceptCards
              ? <ConceptCardsView nodes={mindmapData.nodes || []} />
              : <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 h-full min-h-[600px]">
                  <MindmapRenderer data={mindmapData} />
                </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MindmapModal;