// components/output/InsightsModal.jsx

import { X, Loader, Lightbulb, RefreshCw } from "lucide-react";

// Type config for insight badge colours
const TYPE_CONFIG = {
  definition:     { color: "from-blue-600 to-blue-400",     badge: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  process:        { color: "from-purple-600 to-purple-400",  badge: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  fact:           { color: "from-green-600 to-emerald-400",  badge: "bg-green-500/20 text-green-300 border-green-500/40" },
  "cause-effect": { color: "from-orange-600 to-amber-400",   badge: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  example:        { color: "from-pink-600 to-rose-400",      badge: "bg-pink-500/20 text-pink-300 border-pink-500/40" },
  formula:        { color: "from-cyan-600 to-teal-400",      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
};

const InsightsModal = ({ data, isLoading, error, topicName, onClose, onRetry }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-xl">
              <Lightbulb size={22} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Key Insights</h3>
              {topicName && (
                <p className="text-xs text-gray-400 mt-0.5">{topicName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                <Lightbulb size={20} className="absolute inset-0 m-auto text-cyan-400" />
              </div>
              <p className="text-gray-300 font-medium">Extracting key insights…</p>
              <p className="text-gray-500 text-sm">Analyzing topic content</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 max-w-md w-full text-center">
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Summary banner */}
              {data.summary && (
                <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-xl p-5">
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2">Overview</p>
                  <p className="text-gray-200 leading-relaxed">{data.summary}</p>
                </div>
              )}

              {/* Insight cards grid */}
              {data.insights && data.insights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.insights.map((insight, idx) => {
                    const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG["fact"];
                    return (
                      <div
                        key={idx}
                        className="group relative bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
                      >
                        {/* Coloured top-accent bar */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.color}`} />

                        <div className="flex items-start gap-3">
                          {/* Emoji */}
                          <div className="text-2xl mt-0.5 flex-shrink-0">{insight.emoji}</div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <h4 className="text-white font-semibold text-sm leading-snug">{insight.title}</h4>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${cfg.badge}`}>
                                {insight.type}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default InsightsModal;