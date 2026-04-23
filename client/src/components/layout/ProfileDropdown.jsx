import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/auth");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(o => !o)}
        className="h-8 px-3 rounded-full flex items-center gap-1.5 font-sans
                   bg-gray-100 dark:bg-navy-light
                   text-sm font-semibold text-gray-700 dark:text-slate
                   hover:bg-gray-200 dark:hover:bg-divider
                   transition-colors"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 z-50 font-sans
                        bg-white dark:bg-navy-mid
                        border border-gray-200 dark:border-navy-light
                        rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-divider">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-muted mt-0.5 truncate">
              {user.email}
            </p>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-sm font-medium
                       text-fail
                       hover:bg-gray-50 dark:hover:bg-navy-light
                       transition-colors"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
