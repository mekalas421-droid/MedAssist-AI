"use client";

import { useEffect, useRef } from "react";

/**
 * Animated SVG heartbeat / ECG line for medical branding.
 */
export default function HeartbeatLine({ className = "", color = "#3b82f6", height = 60 }) {
  const pathRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength?.() ?? 1000;
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    path.style.animation = "ecgDraw 2.8s ease-in-out infinite";
  }, []);

  return (
    <svg
      viewBox="0 0 400 80"
      className={className}
      style={{ height }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <style>{`
          @keyframes ecgDraw {
            0%   { stroke-dashoffset: var(--ecg-len, 1000); opacity: 0.4; }
            50%  { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0.4; }
          }
        `}</style>
      </defs>
      <path
        ref={pathRef}
        d="M0 40 L60 40 L80 40 L90 15 L100 60 L115 5 L130 70 L145 40 L200 40 L220 40 L230 15 L240 60 L255 5 L270 70 L285 40 L340 40 L360 40 L370 15 L380 60 L390 40 L400 40"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
