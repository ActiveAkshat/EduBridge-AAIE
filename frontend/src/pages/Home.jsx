import React, { useState, useRef } from "react";
import { ArrowRight, Upload } from "lucide-react";

function Home() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const fileRef = useRef(null);

  const handleButtonClick = () => {
    console.log("Simplify clicked");
  };

  const onPickFile = () => fileRef.current?.click();
  const onFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const isActive = text.trim() !== "" || file !== null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-950 px-6 overflow-hidden">
      {/* Heading */}
      <h1 className="text-xl md:text-xl font-semibold tracking-tight text-white text-center mb-8">
        What'd you like to learn today?
      </h1>

      {/* Textarea with embedded button */}
      <div className="relative w-full max-w-3xl mb-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text or notes here..."
          className="w-full h-20 p-4 pr-14 rounded-xl bg-stone-900 text-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 hover:bg-stone-800/80 transition-all duration-300"
        />
        <button
          onClick={handleButtonClick}
          className={`absolute bottom-3 right-3 rounded-full transition duration-200 z-10 ${
            isActive
            ? "hover:bg-gray-100"
            : "bg-sky-400 hover:bg-sky-500"
          }`}
          style={isActive ? { backgroundColor: "white" } : {}}
        >
          <ArrowRight size={20} color={isActive ? "#1e1e1e" : "white"} />
        </button>
      </div>

      {/* File Upload Section */}
      <div
        className="w-full max-w-3xl border-2 border-dashed border-stone-700 rounded-xl p-4 hover:border-sky-500 hover:bg-stone-900/50 transition-all duration-300 cursor-pointer text-center flex items-center justify-center space-x-2"
        onClick={onPickFile}
      >
        <Upload className="text-white w-5 h-5" />
        <p className="text-white text-sm md:text-base">
          {file ? (
            <>
              <span className="text-sky-400 font-semibold">{file.name}</span> uploaded successfully
            </>
          ) : (
            "Drag and drop your PDF here or click to upload"
          )}
        </p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}

export default Home;
