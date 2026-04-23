export default function StatCard({ label, value, valueColor }) {
  return (
    <div className="bg-white dark:bg-navy-mid border border-gray-100 dark:border-navy-light rounded-2xl p-6 shadow-md dark:shadow-none transition-all duration-300">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-muted mb-2 font-sans">
        {label}
      </p>
      <div className={`text-2xl font-extrabold ${valueColor || "text-gray-900 dark:text-white"} font-sans tracking-tight`}>
        {value}
      </div>
    </div>
  );
}


