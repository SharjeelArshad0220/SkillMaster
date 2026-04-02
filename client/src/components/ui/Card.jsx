export default function Card({ children, className = "", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-navy-mid light:bg-white 
        border border-navy-light light:border-gray-200 
        rounded-xl overflow-hidden
        ${onClick ? "cursor-pointer hover:border-accent transition-all active:scale-[0.99]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
