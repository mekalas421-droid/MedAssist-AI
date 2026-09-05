"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 50%, #312e81 100%)" }}>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20"
           style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 max-w-md w-full premium-card p-10 text-center animate-fadeUp border border-cyan-500/20"
           style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(24px)" }}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
          <AlertCircle className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" size={40} />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The module or record you are looking for does not exist in the MedAssist AI system. It might have been moved or deleted.
        </p>
        <Link
          href="/"
          className="block w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 mb-4"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
