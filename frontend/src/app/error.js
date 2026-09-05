"use client";

import { useEffect } from "react";
import { ServerCrash, RefreshCw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 50%, #312e81 100%)" }}>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20"
           style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-md w-full premium-card p-10 text-center animate-fadeUp border border-rose-500/20"
           style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(24px)" }}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/10 flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
          <ServerCrash className="text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.5)]" size={40} />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">
          System Fault
        </h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          {error?.message || error?.toString() || "The system encountered an unexpected clinical fault. Our engineering team has been notified."}
        </p>
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-rose-500/25 mb-4"
        >
          <RefreshCw size={18} /> Recover Session
        </button>
      </div>
    </div>
  );
}
