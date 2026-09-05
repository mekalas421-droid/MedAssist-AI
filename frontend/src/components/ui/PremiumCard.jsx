"use client";

import { motion } from "framer-motion";

/**
 * A reusable premium glassmorphism card wrapper for dashboard widgets.
 * Retains all functionality of its children but upgrades the aesthetic to
 * match the "Enterprise Medical AI" dark-theme design system.
 */
export default function PremiumCard({ children, className = "", noPadding = false, hover = false }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] transition-all ${
        noPadding ? "" : "p-6"
      } ${className}`}
    >
      {/* Subtle top glare effect */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Subtle corner glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
