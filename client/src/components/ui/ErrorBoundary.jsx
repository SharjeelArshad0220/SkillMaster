import React from "react";
import Button from "./Button";

/**
 * Standard React Error Boundary to prevent the entire app from crashing.
 * If a page or component fails to render, it displays a fallback UI while 
 * preserving the AppShell (navigation, sidebar, etc.).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 py-20 text-center animate-fade-in">
          <div className="w-16 h-16 bg-fail/10 rounded-full flex items-center justify-center mb-6 border border-fail/20 shadow-inner">
            <svg className="w-8 h-8 text-fail" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 dark:text-muted mb-8 max-w-sm mx-auto leading-relaxed">
            An unexpected error occurred while rendering this page. The application state might be inconsistent.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/learn";
              }}
            >
              Back to Dashboard
            </Button>
          </div>
          
          {process.env.NODE_ENV === "development" && (
            <div className="mt-10 p-4 bg-gray-100 dark:bg-navy-mid rounded-lg text-left overflow-auto max-w-2xl border border-gray-200 dark:border-divider">
              <p className="text-[10px] font-bold text-fail uppercase mb-2">Error Detail (Dev Mode Only)</p>
              <pre className="text-[11px] text-gray-600 dark:text-slate font-mono whitespace-pre-wrap">
                {this.state.error?.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
