import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-1xl font-bold">EduBridge</h1>
      <div className="space-x-6">
        <Link to="/" className="hover:text-blue-400">Home</Link>
        <Link to="/history" className="hover:text-blue-400">History</Link>
        <Link to="/subjects" className="hover:text-blue-400">Subjects</Link>
        <Link to="/about" className="hover:text-blue-400">About</Link>
      </div>
    </nav>
  );
}

export default Navbar;
