import { Link, useLocation } from "react-router-dom";
import { HiOutlineHome, HiHome, HiOutlineMap, HiMap, HiOutlineChartBar, HiChartBar } from "react-icons/hi2";

function TabItem({ to, icon: Icon, activeIcon: ActiveIcon, label, active }) {
  const CurrentIcon = active ? ActiveIcon : Icon;
  return (
    <Link 
      to={to}
      className="flex flex-col items-center justify-center gap-0.5
                 flex-1 h-full py-2 transition-colors relative"
    >
      <CurrentIcon className={`w-5 h-5 ${active ? "text-accent-dk dark:text-accent" : "text-gray-400 dark:text-muted"}`} />
      <span className={`text-[10px] font-medium font-sans ${active ? "text-accent-dk dark:text-accent" : "text-gray-400 dark:text-muted"}`}>
        {label}
      </span>
      {active && (
        <div className="absolute top-1 w-1 h-1 rounded-full bg-accent-dk dark:bg-accent" />
      )}
    </Link>
  );
}

export default function BottomTabBar() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50
                    h-16 flex items-center justify-around
                    bg-white dark:bg-navy-mid
                    border-t border-gray-200 dark:border-navy-light
                    px-2 pb-safe shadow-lg">
      <TabItem 
        to="/learn" 
        icon={HiOutlineHome} 
        activeIcon={HiHome} 
        label="Home" 
        active={location.pathname === "/learn"} 
      />
      <TabItem 
        to="/roadmap" 
        icon={HiOutlineMap} 
        activeIcon={HiMap} 
        label="Roadmap" 
        active={location.pathname === "/roadmap"} 
      />
      <TabItem 
        to="/progress" 
        icon={HiOutlineChartBar} 
        activeIcon={HiChartBar} 
        label="Progress" 
        active={location.pathname === "/progress"} 
      />
    </nav>
  );
}
