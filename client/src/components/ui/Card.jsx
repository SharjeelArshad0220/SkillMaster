export default function Card({ children, className = "", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white dark:bg-navy-mid 
        border border-gray-100 dark:border-navy-light 
        rounded-2xl overflow-hidden shadow-md dark:shadow-none
        ${onClick ? "cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

