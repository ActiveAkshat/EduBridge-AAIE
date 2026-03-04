const TopicsSidebar = ({ topics, simplifiedTopics, selectedTopic, selectedLanguage, onTopicClick }) => {
  return (
    <aside className="w-full lg:w-1/4 bg-gray-800 rounded-xl shadow-md p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-blue-400 border-b border-gray-700 pb-2">
        Topics ({topics.length})
      </h2>
      <nav className="space-y-2">
        {topics.map((topic, index) => {
          const simplifiedTopic = simplifiedTopics[index];
          const displayTopic = simplifiedTopic || topic;

          return (
            <button
              key={index}
              onClick={() => onTopicClick(topic)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                selectedTopic && selectedTopic.topic === topic.topic
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}
            >
              <span className="font-medium text-sm leading-tight block">
                {topic.topic || `Topic ${index + 1}`}
              </span>
              {selectedLanguage === "hindi" && displayTopic.topic_hindi && (
                <span className="text-xs text-gray-300 mt-1 block opacity-80">
                  {displayTopic.topic_hindi}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default TopicsSidebar;