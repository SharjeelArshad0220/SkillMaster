export default function StatCard({ label, value, valueColor }) {
  return (
    <div className="bg-navy-mid light:bg-white border border-navy-light light:border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted light:text-gray-400 mb-2">
        {label}
      </p>
      <p className={`text-2xl font-semibold ${valueColor || "text-white light:text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
