/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical Blue primary palette
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Cyan accent
        cyan: {
          50:  "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        // Legacy navy — kept for backwards compat
        navy: {
          950: "#0a0f1e",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
        },
        // Legacy brand (kept for backwards compat)
        canvas: "#f8fafc",
        risk: {
          low:      "#10b981",
          medium:   "#f59e0b",
          high:     "#ef4444",
          critical: "#7f1d1d",
        },
        // Semantic colors
        success:  "#10b981",
        warning:  "#f59e0b",
        danger:   "#ef4444",
        info:     "#3b82f6",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "sans-serif"],
        sans:    ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        card:   "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.1)",
        glass:  "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        glow:   "0 0 20px rgba(59,130,246,0.3)",
        "glow-cyan": "0 0 20px rgba(6,182,212,0.3)",
        "glow-green": "0 0 20px rgba(16,185,129,0.3)",
        panel:  "0 25px 50px rgba(0,0,0,0.25)",
        premium: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(148,163,184,0.1)",
      },
      backgroundImage: {
        "brand-gradient":   "linear-gradient(135deg, #1e40af 0%, #0891b2 100%)",
        "hero-gradient":    "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
        "success-gradient": "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        "danger-gradient":  "linear-gradient(135deg, #dc2626 0%, #f43f5e 100%)",
        "amber-gradient":   "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
        "purple-gradient":  "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%":   { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "14%":      { transform: "scale(1.15)" },
          "28%":      { transform: "scale(1)" },
          "42%":      { transform: "scale(1.1)" },
          "56%":      { transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)" },
          "50%":      { boxShadow: "0 0 24px rgba(59, 130, 246, 0.8)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        pulseLine: {
          "0%":   { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        fadeUp:      "fadeUp 0.5s ease-out forwards",
        fadeIn:      "fadeIn 0.4s ease-out forwards",
        slideInLeft: "slideInLeft 0.4s ease-out forwards",
        scaleIn:     "scaleIn 0.3s ease-out forwards",
        heartbeat:   "heartbeat 1.8s ease-in-out infinite",
        pulseGlow:   "pulseGlow 2s ease-in-out infinite",
        shimmer:     "shimmer 1.8s infinite",
        pulseLine:   "pulseLine 2.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};
