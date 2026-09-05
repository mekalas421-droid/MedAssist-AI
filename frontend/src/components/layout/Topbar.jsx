"use client";

import { Search, Bell } from "lucide-react";

export default function Topbar({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-brand-100 px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-navy-900">{title}</h1>
        {subtitle && <p className="text-sm text-navy-800/60 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <label className="hidden md:flex items-center gap-2 bg-canvas rounded-lg px-3 py-2 border border-brand-100 focus-within:border-brand-400 transition-colors">
          <Search size={16} className="text-navy-800/40" />
          <input
            type="text"
            placeholder="Search symptoms, reports..."
            className="bg-transparent text-sm outline-none w-48 placeholder:text-navy-800/40"
          />
        </label>

        <button
          type="button"
          aria-label="Notifications"
          className="relative h-9 w-9 rounded-lg border border-brand-100 flex items-center justify-center text-navy-800/70 hover:bg-canvas transition-colors"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="h-9 w-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-semibold font-mono">
          RA
        </div>
      </div>
    </header>
  );
}
