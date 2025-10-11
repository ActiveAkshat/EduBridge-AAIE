import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import History from "./pages/History";
import Subjects from "./pages/Subjects";
import About from "./pages/About";

function App() {
  return (
    <Router>
      <div className="flex bg-gray-950 text-white min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 ml-16 p-6 flex justify-center items-center">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
