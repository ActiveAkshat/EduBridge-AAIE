import { X, Loader } from "lucide-react";

const ImagesModal = ({ selectedTopic, imagesData, isLoading, error, onClose, onRetry }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🖼️</span>
          Concept Visuals: {selectedTopic?.topic}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition">
          <X size={24} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader size={48} className="animate-spin text-pink-500" />
            <p className="text-gray-300 text-lg">Generating concept visuals...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
              <p className="text-red-300 text-center mb-4">{error}</p>
              <button onClick={onRetry} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                Retry
              </button>
            </div>
          </div>
        ) : imagesData?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imagesData.map((img, idx) => (
              <div key={idx} className="bg-gray-700 rounded-xl overflow-hidden shadow-lg">
                {img.error ? (
                  <div className="h-48 flex items-center justify-center bg-gray-600">
                    <p className="text-gray-400 text-sm text-center px-4">❌ Could not generate this image</p>
                  </div>
                ) : (
                  <img
                    src={img.image_b64 ? `data:image/png;base64,${img.image_b64}` : img.image_url}
                    alt={img.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="text-white font-semibold mb-1">{img.title}</h4>
                  <p className="text-gray-400 text-sm">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

export default ImagesModal;