export default function PillOption({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        h-9 px-5 rounded-full border text-sm font-medium transition-all duration-150
        ${selected
          ? "bg-accent border-accent text-navy"
          : "bg-transparent border-divider text-muted hover:border-slate hover:text-slate"
        }
      `}
    >
      {label}
    </button>
  );
}
