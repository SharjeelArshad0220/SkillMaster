import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import Button from "../../components/ui/Button";
import PillOption from "../../components/ui/PillOption";

export default function SetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createRoadmap, isGenerating } = useApp();

  const [form, setForm] = useState({
    role: "",
    skill: "",
    goal: "",
    dailyTime: "30 – 60 minutes",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.role)      newErrors.role      = "Required";
    if (!form.skill)     newErrors.skill     = "Required";
    if (!form.goal)      newErrors.goal      = "Required";
    if (!form.dailyTime) newErrors.dailyTime = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      await createRoadmap(form);
      navigate("/roadmap");
    } catch (err) {
      console.error("Failed to generate roadmap:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy font-sans py-12 px-5 md:px-0">
      <div className="max-w-[720px] mx-auto">
        {/* Page title block */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 dark:text-white">
            Set Up Your Learning Profile
          </h1>
          <p className="text-sm md:text-[14px] text-gray-500 dark:text-muted mt-2">
            Welcome, {user?.firstName || user?.name?.split(" ")[0]}. Tell us your goal and preferences so we can build your roadmap.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light rounded-xl p-6 md:p-10 shadow-sm">
          <form onSubmit={handleSubmit}>
            
            {/* LEARNER INFORMATION */}
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent-dk dark:text-accent mb-4">
                LEARNER INFORMATION
              </p>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-3">
                Which best describes you? {errors.role && <span className="text-fail ml-2">Required</span>}
              </label>
              <div className="flex flex-wrap gap-2.5">
                {["Student", "Job Seeker", "Other"].map((option) => (
                  <PillOption
                    key={option}
                    label={option}
                    selected={form.role === option}
                    onClick={() => {
                      setForm((f) => ({ ...f, role: option }));
                      if (errors.role) setErrors(prev => ({ ...prev, role: null }));
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="my-8 border-t border-gray-100 dark:border-divider" />

            {/* LEARNING GOAL */}
            <div className="mb-8 grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-1">
                  What skill do you want to learn? {errors.skill && <span className="text-fail ml-2">Required</span>}
                </label>
                <input
                  type="text"
                  className={`w-full h-[42px] px-4 rounded-lg text-sm font-sans
                             bg-white dark:bg-navy
                             border border-gray-300 dark:border-divider
                             text-gray-900 dark:text-white
                             placeholder:text-gray-300 dark:placeholder:text-muted
                             focus:border-accent-dk dark:focus:border-accent
                             focus:outline-none focus:ring-0 transition-colors
                             ${errors.skill ? "border-fail dark:border-fail" : ""}`}
                  placeholder="e.g. React.js, Python, Data Science"
                  value={form.skill}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, skill: e.target.value }));
                    if (errors.skill) setErrors(prev => ({ ...prev, skill: null }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-1">
                  Tell us more about your learning goal {errors.goal && <span className="text-fail ml-2">Required</span>}
                </label>
                <textarea
                  className={`w-full px-4 py-3 rounded-lg text-sm font-sans
                             bg-white dark:bg-navy
                             border border-gray-300 dark:border-divider
                             text-gray-900 dark:text-white
                             placeholder:text-gray-300 dark:placeholder:text-muted
                             focus:border-accent-dk dark:focus:border-accent
                             focus:outline-none focus:ring-0
                             resize-none h-[88px] transition-colors
                             ${errors.goal ? "border-fail dark:border-fail" : ""}`}
                  placeholder="e.g. I want to switch careers into tech"
                  value={form.goal}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, goal: e.target.value }));
                    if (errors.goal) setErrors(prev => ({ ...prev, goal: null }));
                  }}
                />
              </div>
            </div>

            <div className="my-8 border-t border-gray-100 dark:border-divider" />

            {/* PREFERENCES */}
            <div className="mb-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent-dk dark:text-accent mb-4">
                PREFERENCES
              </p>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-1">
                  Daily time commitment?
                </label>
                <select
                  className="w-full h-[42px] px-4 rounded-lg text-sm font-sans
                             appearance-none
                             bg-white dark:bg-navy
                             border border-gray-300 dark:border-divider
                             text-gray-900 dark:text-slate
                             focus:border-accent-dk dark:focus:border-accent
                             focus:outline-none focus:ring-0 transition-colors"
                  value={form.dailyTime}
                  onChange={(e) => setForm((f) => ({ ...f, dailyTime: e.target.value }))}
                >
                  <option value="30 – 60 minutes">30 – 60 minutes</option>
                  <option value="1 – 2 hours">1 – 2 hours</option>
                  <option value="2+ hours">2+ hours</option>
                </select>
              </div>
            </div>

            {/* ACTION AREA */}
            
            {/* Desktop footer (MD and up) */}
            <div className="hidden md:flex items-center justify-end mt-8 pt-8 border-t border-gray-100 dark:border-divider">
              <Button 
                variant="primary" 
                loading={isGenerating} 
                onClick={handleSubmit}
                type="submit"
              >
                {isGenerating ? "Generating your roadmap..." : "Generate Roadmap"}
              </Button>
            </div>

            {/* Mobile footer (SM and below) */}
            <div className="md:hidden flex flex-col gap-2.5 mt-8 pt-6 border-t border-gray-100 dark:border-divider">
              <Button 
                variant="primary" 
                fullWidth 
                loading={isGenerating} 
                onClick={handleSubmit}
                type="submit"
              >
                {isGenerating ? "Generating..." : "Generate Roadmap"}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
