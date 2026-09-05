"use client";

import { motion } from "framer-motion";

export function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16 mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500/20 drop-shadow-md">
          <path 
            d="M 0 50 L 25 50 L 35 20 L 45 80 L 55 10 L 65 50 L 100 50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4"
          />
        </svg>
        <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full text-blue-500 drop-shadow-lg">
          <path 
            className="ecg-path"
            d="M 0 50 L 25 50 L 35 20 L 45 80 L 55 10 L 65 50 L 100 50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4"
          />
        </svg>
      </div>
      <p className="text-slate-400 font-medium text-sm animate-pulse">{text}</p>
    </div>
  );
}

export function SkeletonLoader({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 w-full rounded-xl skeleton-shimmer bg-slate-800/50" />
      ))}
    </div>
  );
}
