"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartPulse,
  LayoutDashboard,
  Stethoscope,
  FileText,
  BarChart3,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/symptoms", label: "Symptom Checker", icon: Stethoscope },
  { href: "/reports", label: "Health Reports", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-navy-900 text-white min-h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-2 border-b border-white/10">
        <HeartPulse className="text-brand-300" size={26} />
        <span className="font-display text-lg font-semibold tracking-tight">MedAssist AI</span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Clinical Tools
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-600/20 text-white border-l-2 border-brand-400"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/40">
          <ShieldCheck size={14} />
          HIPAA-aware demo build
        </div>
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
