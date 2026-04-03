import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../hooks/useApp";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

// Phase Components
import LessonPhase from "./phases/LessonPhase";
import TaskPhase from "./phases/TaskPhase";
import FeedbackPhase from "./phases/FeedbackPhase";
import ExamPhase from "./phases/ExamPhase";
import ExamResult from "./ExamResult";

const PHASES = {
  LESSON: "lesson",
  TASK: "task",
  FEEDBACK: "feedback",
  EXAM: "exam",
  RESULT: "result"
};

/**
 * Main session page container that manages the phase state machine.
 */
export default function SessionPage() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roadmapJson, progress, isRestoring, advanceProgress, completeExamProgress } = useApp();
  
  const [phase, setPhase] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for phase results
  const [feedbackData, setFeedbackData] = useState(null);
  const [examResultData, setExamResultData] = useState(null);

  useEffect(() => {
    // Wait for AppContext to finish restoring from localStorage/API
    if (isRestoring || !user) return;

    // If restoration finished and no roadmap exists, user needs setup
    if (!roadmapJson) {
      console.warn("No roadmap found, redirecting to setup.");
      navigate("/setup");
      return;
    }

    if (!dayId) return;

    // Helper to find specific day by composite ID (e.g. m1-w1-d1)
    const findDayById = (id) => {
      const parts = id.split("-");
      if (parts.length < 3) {
        console.error("Invalid session ID format:", id);
        return null;
      }

      const [mStr, wStr, dStr] = parts;
      const mNum = parseInt(mStr.replace("m", ""));
      const wNum = parseInt(wStr.replace("w", ""));
      const dNum = parseInt(dStr.replace("d", ""));

      const mod = roadmapJson.modules.find(m => m.moduleNumber === mNum);
      const week = mod?.weeks.find(w => w.weekNumber === wNum);
      const day = week?.days.find(d => d.dayNumber === dNum);

      if (!day) return null;
      return { 
        ...day, 
        moduleNumber: mNum, 
        weekNumber: wNum, 
        dayId: id 
      };
    };

    const daySession = findDayById(dayId);

    if (!daySession) {
      console.error("Session day not found for ID:", dayId);
      navigate("/learn");
      return;
    }

    setSession(daySession);

    // Initial phase logic
    if (daySession.type === "Exam") {
      setPhase(PHASES.EXAM);
    } else {
      setPhase(PHASES.LESSON);
    }
    
    setLoading(false);
  }, [roadmapJson, dayId, navigate, isRestoring, user]);

  if (loading || !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // PHASE TRANSITIONS
  const handleLessonComplete = () => {
    setPhase(PHASES.TASK);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const handleTaskSubmit = (feedback) => {
    setFeedbackData(feedback);
    setPhase(PHASES.FEEDBACK);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFeedbackComplete = async () => {
    try {
      await advanceProgress(dayId, "passed");
      navigate("/learn");
    } catch (err) {
      console.error("Progress advancement failed:", err);
      navigate("/learn"); // Fallback
    }
  };

  const handleExamComplete = (result) => {
    setExamResultData(result);
    setPhase(PHASES.RESULT);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResultFinish = async () => {
    try {
      // If pass, advance. If fail, the engine handles pedagogical logic (back to Sat).
      await completeExamProgress(
        dayId, 
        examResultData.score, 
        examResultData.passed, 
        examResultData.weakTopics
      );
      navigate("/learn");
    } catch (err) {
      console.error("Exam progress advancement failed:", err);
      navigate("/learn");
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case PHASES.LESSON:   return "Lesson Content";
      case PHASES.TASK:     return "Practical Task";
      case PHASES.FEEDBACK: return "AI Review";
      case PHASES.EXAM:     return "Weekly Exam";
      case PHASES.RESULT:   return "Exam Result";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy font-sans pb-20 animate-fade-in transition-colors duration-300">
      <main className="max-w-[760px] mx-auto px-5 pt-28 md:pt-32">
        {/* Refined Session Header (Now Inline) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-gray-200 dark:border-navy-light">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-dk dark:text-accent">
              {getPhaseLabel()}
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {session.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 dark:text-muted uppercase tracking-widest mb-1">
                LOCATION
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-slate">
                Day {session.dayNumber}
              </span>
            </div>
            <div className="h-10 w-[1px] bg-gray-200 dark:bg-navy-light hidden md:block" />
            <Badge variant={session.type.toLowerCase()} className="py-2 px-4 text-xs font-bold uppercase tracking-wider">
              {session.type}
            </Badge>
          </div>
        </div>

        {/* Dynamic Phase Engine */}
        <div className="relative">
        {phase === PHASES.LESSON && <LessonPhase lesson={session.lesson} onComplete={handleLessonComplete} />}
        {phase === PHASES.TASK && <TaskPhase task={session.task} dayId={dayId} onComplete={handleTaskSubmit} />}
        {phase === PHASES.FEEDBACK && <FeedbackPhase feedbackData={feedbackData} onClose={handleFeedbackComplete} />}
        {phase === PHASES.EXAM && <ExamPhase questions={session.examQuestions} onComplete={handleExamComplete} />}
        {phase === PHASES.RESULT && <ExamResult result={examResultData} onClose={handleResultFinish} />}
        </div>
      </main>
    </div>
  );
}
