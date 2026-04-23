import LoadingSpinner from "./LoadingSpinner";

const variants = {
  primary:   "bg-accent-dk dark:bg-accent text-white dark:text-navy hover:bg-sky-600 dark:hover:bg-accent-dk font-semibold",
  secondary: "bg-transparent border border-divider text-muted hover:text-slate",
  ghost:     "bg-transparent border border-divider text-muted",
  danger:    "bg-fail text-white hover:opacity-90 font-semibold",
};

const sizes = {
  sm: "h-7 px-3 text-xs rounded-md",
  md: "h-10 px-6 text-sm rounded-lg",
  lg: "h-11 px-7 text-sm rounded-lg",
};

export default function Button({
  variant = "primary", 
  size = "md", 
  fullWidth = false,
  loading = false, 
  disabled = false, 
  onClick, 
  children, 
  type = "button"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 transition-all duration-150
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
      `}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}
