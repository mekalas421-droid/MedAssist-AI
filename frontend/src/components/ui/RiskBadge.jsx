const CONFIG = {
  low: { label: "Low Risk", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  medium: { label: "Medium Risk", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  high: { label: "High Risk", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  critical: { label: "Critical", bg: "bg-red-900/10", text: "text-red-900", dot: "bg-red-900" },
};

export default function RiskBadge({ level = "low", className = "" }) {
  const c = CONFIG[level] || CONFIG.low;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
