import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function AuthPage() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  if (user) return <Navigate to="/learn" replace />;

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Enter a valid email address";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (mode === "signup") {
      if (!formData.name) newErrors.name = "Name is required";
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      if (mode === "login") {
        const u = await login(formData.email, formData.password);
        if (u.hasRoadmap) navigate("/learn");
        else navigate("/setup");
      } else {
        await signup(formData.name, formData.email, formData.password);
        navigate("/setup");
      }
    } catch (err) {
      setErrors({ server: err.response?.data?.message || "Authentication failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (label, name, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-700 dark:text-slate">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={formData[name]}
        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
        className={`w-full h-10 px-4 rounded-lg text-sm font-sans
                   bg-white dark:bg-navy
                   border ${errors[name] ? "border-fail" : "border-gray-300 dark:border-divider"}
                   text-gray-900 dark:text-white
                   placeholder:text-gray-300 dark:placeholder:text-muted
                   focus:border-accent-dk dark:focus:border-accent
                   focus:outline-none focus:ring-0
                   transition-colors`}
      />
      {errors[name] && <p className="text-xs text-fail">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-navy font-sans">
      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex w-full min-h-screen">
        {/* LEFT PANEL — Branding */}
        <div className="w-[40%] flex flex-col items-center justify-center
                        bg-white dark:bg-navy-mid
                        border-r border-gray-200 dark:border-navy-light
                        p-12 gap-6">
          <div className="w-10 h-10 rounded-[10px] bg-accent-dk dark:bg-accent
                          flex items-center justify-center">
            <img src="/skill-master-logo.svg" alt="Logo" className="w-6 h-6" />
          </div>
          <h1 className="text-[26px] font-semibold text-gray-900 dark:text-white tracking-tight">
            Skill Master
          </h1>
          <p className="text-sm text-gray-400 dark:text-muted text-center">
            AI-powered personalized learning
          </p>
          <p className="text-xs italic text-gray-300 dark:text-muted opacity-60 mt-4">
            Learn. Track. Master.
          </p>
        </div>

        {/* RIGHT PANEL — Auth Form */}
        <div className="w-[60%] flex items-center justify-center p-12 bg-gray-50 dark:bg-navy">
          <div className="w-full max-w-[400px]
                          bg-white dark:bg-navy-mid
                          border border-gray-200 dark:border-navy-light
                          rounded-xl p-8 shadow-sm">
            {/* TABS */}
            <div className="flex border-b border-gray-200 dark:border-divider mb-8">
              <button 
                type="button"
                onClick={() => setMode("login")}
                className={`px-6 py-3 text-sm font-semibold transition-colors
                  ${mode === "login" 
                    ? "text-gray-900 dark:text-white border-b-2 border-accent-dk dark:border-accent" 
                    : "text-gray-400 dark:text-muted hover:text-gray-700 dark:hover:text-slate"}`}
              >
                Log In
              </button>
              <button 
                type="button"
                onClick={() => setMode("signup")}
                className={`px-6 py-3 text-sm font-medium transition-colors
                  ${mode === "signup" 
                    ? "text-gray-900 dark:text-white border-b-2 border-accent-dk dark:border-accent" 
                    : "text-gray-400 dark:text-muted hover:text-gray-700 dark:hover:text-slate"}`}
              >
                Sign Up
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && renderInput("Name", "name", "text", "Your Name")}
              {renderInput("Email", "email", "email", "email@example.com")}
              {renderInput("Password", "password", "password", "••••••••")}
              {mode === "signup" && renderInput("Confirm Password", "confirmPassword", "password", "••••••••")}

              {errors.server && <p className="text-xs text-fail text-center">{errors.server}</p>}

              <button 
                disabled={isLoading}
                type="submit"
                className="w-full h-10 rounded-lg text-sm font-semibold font-sans
                           bg-accent-dk dark:bg-accent
                           text-white dark:text-navy
                           hover:bg-sky-600 dark:hover:bg-accent-dk
                           active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><LoadingSpinner size="sm" /> {mode === "login" ? "Logging in..." : "Signing up..."}</>
                ) : (
                  mode === "login" ? "Log In" : "Sign Up"
                )}
              </button>

              <p className="text-center text-sm text-gray-400 dark:text-muted mt-4">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-accent-dk dark:text-accent font-medium hover:underline"
                >
                  {mode === "login" ? "Sign Up" : "Log In"}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex flex-col w-full min-h-screen bg-gray-50 dark:bg-navy">
        {/* TOP BRANDING ZONE */}
        <div className="h-[35vh] flex flex-col items-center justify-center
                        bg-white dark:bg-navy-mid gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-accent-dk dark:bg-accent
                          flex items-center justify-center">
             <img src="/skill-master-logo.svg" alt="Logo" className="w-5 h-5" />
          </div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight">
            Skill Master
          </h1>
          <p className="text-xs text-gray-400 dark:text-muted text-center">
            AI-powered personalized learning
          </p>
        </div>
        
        {/* BOTTOM FORM ZONE */}
        <div className="flex-1 px-6 pt-7 pb-10">
          <div className="flex border-b border-gray-200 dark:border-divider mb-8">
            <button 
              type="button"
              onClick={() => setMode("login")}
              className={`px-6 py-3 text-sm font-semibold transition-colors
                ${mode === "login" 
                  ? "text-gray-900 dark:text-white border-b-2 border-accent-dk dark:border-accent" 
                  : "text-gray-400 dark:text-muted hover:text-gray-700 dark:hover:text-slate"}`}
            >
              Log In
            </button>
            <button 
              type="button"
              onClick={() => setMode("signup")}
              className={`px-6 py-3 text-sm font-medium transition-colors
                ${mode === "signup" 
                  ? "text-gray-900 dark:text-white border-b-2 border-accent-dk dark:border-accent" 
                  : "text-gray-400 dark:text-muted hover:text-gray-700 dark:hover:text-slate"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && renderInput("Name", "name", "text", "Your Name")}
            {renderInput("Email", "email", "email", "email@example.com")}
            {renderInput("Password", "password", "password", "••••••••")}
            {mode === "signup" && renderInput("Confirm Password", "confirmPassword", "password", "••••••••")}

            {errors.server && <p className="text-xs text-fail text-center">{errors.server}</p>}

            <button 
              disabled={isLoading}
              type="submit"
              className="w-full h-10 rounded-lg text-sm font-semibold font-sans
                         bg-accent-dk dark:bg-accent
                         text-white dark:text-navy
                         hover:bg-sky-600 dark:hover:bg-accent-dk
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><LoadingSpinner size="sm" /> {mode === "login" ? "Logging in..." : "Signing up..."}</>
              ) : (
                mode === "login" ? "Log In" : "Sign Up"
              )}
            </button>

            <p className="text-center text-sm text-gray-400 dark:text-muted mt-4">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-accent-dk dark:text-accent font-medium hover:underline"
              >
                {mode === "login" ? "Sign Up" : "Log In"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
