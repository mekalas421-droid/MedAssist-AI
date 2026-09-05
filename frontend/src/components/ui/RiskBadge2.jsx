"use client";

/**
 * Premium risk badge with gradient pill design.
 */
export default function RiskBadge2({ level }) {
  const map = {
    low:      { label: "LOW RISK",      cls: "risk-badge-low" },
    medium:   { label: "MEDIUM RISK",   cls: "risk-badge-medium" },
    high:     { label: "HIGH RISK",     cls: "risk-badge-high" },
    critical: { label: "CRITICAL",      cls: "risk-badge-critical" },
    Low:      { label: "LOW RISK",      cls: "risk-badge-low" },
    Medium:   { label: "MEDIUM RISK",   cls: "risk-badge-medium" },
    High:     { label: "HIGH RISK",     cls: "risk-badge-high" },
    Critical: { label: "CRITICAL",      cls: "risk-badge-critical" },
  };

  const config = map[level] || { label: (level || "UNKNOWN").toUpperCase(), cls: "risk-badge-low" };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${config.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  );
}
