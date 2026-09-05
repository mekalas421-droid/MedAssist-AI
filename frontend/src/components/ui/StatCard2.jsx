"use client";

import { useEffect, useState } from "react";

/**
 * Premium animated stat card with gradient icon box, counter animation, and trend badge.
 */
export default function StatCard2({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  gradient = "brand",
  delay = 0,
}) {
  const [displayed, setDisplayed] = useState(0);
  const numericValue = typeof value === "number" ? value : null;

  const gradients = {
    brand:   "from-blue-600 to-cyan-500",
    emerald: "from-emerald-600 to-green-400",
    rose:    "from-rose-600 to-pink-500",
    amber:   "from-amber-600 to-yellow-400",
    purple:  "from-violet-600 to-purple-400",
  };

  useEffect(() => {
    if (numericValue === null) return;
    const start = 0;
    const end = numericValue;
    const duration = 900;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setDisplayed(Math.round(start + (end - start) * (current / steps)));
      if (current >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [numericValue]);

  const trendColor =
    trend > 0 ? "text-emerald-400 bg-emerald-400/10" :
    trend < 0 ? "text-red-400 bg-red-400/10" :
    "text-slate-400 bg-slate-400/10";

  const trendArrow = trend > 0 ? "↑" : trend < 0 ? "↓" : "→";

  return (
    <div
      className="stat-card animate-fadeUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[gradient] || gradients.brand} flex items-center justify-center shadow-md`}>
          {Icon && <Icon size={20} className="text-white" />}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendColor}`}>
            {trendArrow} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="animate-count">
        <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {numericValue !== null ? displayed.toLocaleString() : value}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
        {trendLabel && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{trendLabel}</p>
        )}
      </div>
    </div>
  );
}
