import { Link, useLocation } from "react-router-dom";
import { Home, Clock, BookOpen, Info, Settings } from "lucide-react";

function Sidebar() {
  const location = useLocation();

  const links = [
    { to: "/", icon: <Home size={22} />, label: "Home" },
    { to: "/history", icon: <Clock size={22} />, label: "History" },
    { to: "/subjects", icon: <BookOpen size={22} />, label: "Subjects" },
    { to: "/about", icon: <Info size={22} />, label: "About" },
  ];

  return (
    <div className="fixed top-0 left-0 h-full w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center justify-between py-6">
      {/* Top Icon (Logo Placeholder) */}
      <div className="text-blue-400 font-bold text-2xl">⚡</div>

      {/* Middle Links */}
      <div className="flex flex-col gap-6">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center justify-center text-gray-400 hover:text-blue-400 transition ${
              location.pathname === link.to ? "text-blue-400" : ""
            }`}
          >
            {link.icon}
            <span className="text-[10px] mt-1">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Bottom Settings */}
      <Link
        to="/settings"
        className={`flex flex-col items-center text-gray-400 hover:text-blue-400 transition ${
          location.pathname === "/settings" ? "text-blue-400" : ""
        }`}
      >
        <Settings size={22} />
        <span className="text-[10px] mt-1">Settings</span>
      </Link>
    </div>
  );
}

export default Sidebar;
