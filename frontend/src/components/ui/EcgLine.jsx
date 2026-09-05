"use client";

/**
 * EcgLine — the app's signature visual motif: a clinical heartbeat trace.
 * `tone` picks the stroke color for use on light or dark surfaces.
 */
export default function EcgLine({ className = "", tone = "light", animated = true }) {
  const stroke = tone === "light" ? "#78b0e2" : "#2e86c1";
  return (
    <svg
      viewBox="0 0 600 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 40 H120 L145 40 L158 10 L172 70 L186 40 L205 40 L225 40 L240 15 L255 65 L270 40 L600 40"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animated
            ? {
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                animation: "pulseLine 2.6s ease-out forwards",
              }
            : undefined
        }
      />
    </svg>
  );
}
