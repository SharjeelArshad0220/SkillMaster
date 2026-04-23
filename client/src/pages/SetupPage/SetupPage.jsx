import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { generateRoadmap, getActiveRoadmap } from "../../api/roadmap.api";
import Button from "../../components/ui/Button";
import PillOption from "../../components/ui/PillOption";

export default function SetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setRoadmapData } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);

  const [form, setForm] = useState({
    role: "Student",
    skillInput: "",
    motivation: "",
    currentLevel: "Beginner",
    learningStyle: "Reading",
    goalClarity: "General",
    dailyTime: "30 – 60 minutes",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.role)         newErrors.role         = "Required";
    if (!form.skillInput)   newErrors.skillInput   = "Required";
    if (!form.motivation)   newErrors.motivation   = "Required";
    if (!form.currentLevel) newErrors.currentLevel = "Required";
    if (!form.goalClarity)  newErrors.goalClarity  = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsGenerating(true);
    try {
      await generateRoadmap(form);
      const data = await getActiveRoadmap();
      setRoadmapData(data.roadmapId, data.roadmapJson, data.progress);
      navigate("/roadmap");
    } catch (err) {
      console.error("Failed to generate roadmap:", err);
    } finally {
      setIsGenerating(false);
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
              
              <div className="space-y-6">
                <div>
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

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-3">
                    What is your current level? {errors.currentLevel && <span className="text-fail ml-2">Required</span>}
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {["Beginner", "Intermediate", "Advanced"].map((option) => (
                      <PillOption
                        key={option}
                        label={option}
                        selected={form.currentLevel === option}
                        onClick={() => {
                          setForm((f) => ({ ...f, currentLevel: option }));
                          if (errors.currentLevel) setErrors(prev => ({ ...prev, currentLevel: null }));
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="my-8 border-t border-gray-100 dark:border-divider" />

            {/* LEARNING GOAL */}
            <div className="mb-8 grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-1">
                  What skill do you want to learn? {errors.skillInput && <span className="text-fail ml-2">Required</span>}
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
                             ${errors.skillInput ? "border-fail dark:border-fail" : ""}`}
                  placeholder="e.g. React.js, Python, Data Science"
                  value={form.skillInput}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, skillInput: e.target.value }));
                    if (errors.skillInput) setErrors(prev => ({ ...prev, skillInput: null }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-1">
                  How clear is your goal? {errors.goalClarity && <span className="text-fail ml-2">Required</span>}
                </label>
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {["Clear", "General", "Exploring"].map((option) => (
                    <PillOption
                      key={option}
                      label={option === "Clear" ? "I know exactly" : option === "General" ? "General direction" : "Just exploring"}
                      selected={form.goalClarity === option}
                      onClick={() => {
                        setForm((f) => ({ ...f, goalClarity: option }));
                        if (errors.goalClarity) setErrors(prev => ({ ...prev, goalClarity: null }));
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-1">
                  Tell us more about your learning goal {errors.motivation && <span className="text-fail ml-2">Required</span>}
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
                             ${errors.motivation ? "border-fail dark:border-fail" : ""}`}
                  placeholder="e.g. I want to switch careers into tech"
                  value={form.motivation}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, motivation: e.target.value }));
                    if (errors.motivation) setErrors(prev => ({ ...prev, motivation: null }));
                  }}
                />
              </div>
            </div>

            <div className="my-8 border-t border-gray-100 dark:border-divider" />

            {/* PREFERENCES */}
            <div className="mb-0 space-y-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent-dk dark:text-accent mb-4">
                PREFERENCES
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate mb-1">
                    Preferred learning style?
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {["Reading", "Examples", "Practice"].map((option) => (
                      <PillOption
                        key={option}
                        label={option}
                        selected={form.learningStyle === option}
                        onClick={() => setForm((f) => ({ ...f, learningStyle: option }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION AREA */}
            <div className="hidden md:flex items-center justify-end mt-12 pt-8 border-t border-gray-100 dark:border-divider">
              <Button 
                variant="primary" 
                loading={isGenerating} 
                onClick={handleSubmit}
                type="submit"
              >
                {isGenerating ? "Generating your roadmap..." : "Generate Roadmap"}
              </Button>
            </div>

            <div className="md:hidden flex flex-col gap-2.5 mt-12 pt-6 border-t border-gray-100 dark:border-divider">
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
