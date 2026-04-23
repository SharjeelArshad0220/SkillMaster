export default function LoadingSpinner({ size = "md" }) {
  const sizes = { 
    sm: "w-4 h-4", 
    md: "w-5 h-5", 
    lg: "w-8 h-8" 
  };
  
  return (
    <div className={`${sizes[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
}
