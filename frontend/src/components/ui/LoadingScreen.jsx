"use client";

/**
 * Full-screen premium loading screen with animated heartbeat.
 */
export default function LoadingScreen({ message = "Loading…" }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-mesh-gradient"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Animated heartbeat icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-glow animate-heartbeat">
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-40 animate-ping" />
      </div>

      {/* ECG line */}
      <svg viewBox="0 0 300 40" className="w-48 h-8 mb-6" fill="none">
        <path
          d="M0 20 L40 20 L55 20 L62 8 L70 30 L78 2 L86 36 L94 20 L130 20 L145 20 L152 8 L160 30 L168 2 L176 36 L184 20 L220 20 L240 20 L248 8 L256 30 L264 2 L272 36 L280 20 L300 20"
          stroke="url(#ecgG)"
          strokeWidth="2"
          strokeLinecap="round"
          className="ecg-path"
        />
        <defs>
          <linearGradient id="ecgG" x1="0" y1="0" x2="300" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{typeof message === 'object' ? message?.msg || message?.message || JSON.stringify(message) : message}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>MedAssist AI Platform</p>
    </div>
  );
}
