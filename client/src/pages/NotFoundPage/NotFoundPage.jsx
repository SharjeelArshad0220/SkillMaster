import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    bg-gray-50 dark:bg-navy font-sans px-5 text-center">
      {/* Large 404 text using the divider token in dark mode */}
      <p className="text-7xl font-bold text-gray-200 dark:text-divider mb-4">
        404
      </p>
      
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Page not found
      </h1>
      
      <p className="text-sm text-gray-400 dark:text-muted mb-8">
        The page you are looking for does not exist.
      </p>

      {/* Conditional button navigation based on auth state */}
      <div className="flex justify-center">
        <Button 
          variant="primary" 
          onClick={() => navigate(user ? "/learn" : "/auth")}
        >
          {user ? "Back to Dashboard" : "Go to Login"}
        </Button>
      </div>
    </div>
  );
}
