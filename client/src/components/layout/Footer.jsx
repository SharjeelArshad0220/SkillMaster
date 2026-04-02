import { useApp } from "../../context/AppContext";

export default function Footer() {
  const { roadmapJson, progress } = useApp();

  return (
    <footer className="hidden md:block
                       bg-white dark:bg-navy-mid
                       border-t border-gray-200 dark:border-navy-light
                       px-6 py-3 mt-auto">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-muted font-sans">
          Skill Master — MVP v1.0
        </span>

        <span className="text-xs font-medium text-gray-500 dark:text-muted font-sans">
          {roadmapJson ? `Learning: ${roadmapJson.skillName}` : "No active skill"}
        </span>

        <span className="text-xs text-gray-400 dark:text-muted font-sans">
          {progress
            ? `Module ${progress.currentModule} · Week ${progress.currentWeek} · Day ${progress.currentDay}`
            : "—"
          }
        </span>
      </div>
    </footer>
  );
}
