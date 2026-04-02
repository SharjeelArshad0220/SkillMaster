import { Link, useLocation } from "react-router-dom";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { useTheme } from "../../hooks/useTheme";
import ProfileDropdown from "./ProfileDropdown";

function NavLink({ to, label, active }) {
  return (
    <Link 
      to={to}
      className={`text-sm font-medium pb-1 transition-colors
        ${active
          ? "text-gray-900 dark:text-white border-b-2 border-accent-dk dark:border-accent"
          : "text-gray-400 dark:text-muted hover:text-gray-700 dark:hover:text-slate"
        }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50
                    h-14 flex items-center justify-between px-6
                    bg-white dark:bg-navy-mid
                    border-b border-gray-200 dark:border-navy-light shadow-sm">

      {/* LEFT — Logo */}
      <div className="flex items-center gap-2">
        <img src="/skill-master-logo.svg" alt="Skill Master" className="w-7 h-7" />
        <span className="text-base font-semibold text-gray-900 dark:text-white font-sans">
          Skill Master
        </span>
      </div>

      {/* CENTER — Nav Links (Desktop Only) */}
      <div className="hidden md:flex items-center gap-8">
        <NavLink to="/learn" label="Home" active={location.pathname === "/learn"} />
        <NavLink to="/roadmap" label="Roadmap" active={location.pathname === "/roadmap"} />
        <NavLink to="/progress" label="Progress" active={location.pathname === "/progress"} />
      </div>

      {/* RIGHT — Theme + Profile */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center
                     text-gray-400 dark:text-muted
                     hover:text-gray-700 dark:hover:text-slate
                     rounded-lg transition-all active:scale-95"
        >
          {theme === "dark" ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
        </button>
        <ProfileDropdown />
      </div>
    </nav>
  );
}
