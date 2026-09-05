"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, Menu, X, Bell, Search, ChevronDown, User } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Premium enterprise dashboard shell.
 * Accepts navItems array and renders the role-appropriate sidebar + topbar.
 */
export default function DashboardShell({ navItems = [], children, role = "patient" }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close menus on outside click
  useEffect(() => {
    function handler(e) {
      if (sidebarOpen && !e.target.closest(".glass-sidebar") && !e.target.closest(".sidebar-toggle")) {
        setSidebarOpen(false);
      }
      if (!e.target.closest(".notif-container")) setNotifOpen(false);
      if (!e.target.closest(".user-container")) setUserMenuOpen(false);
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [sidebarOpen]);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const roleLabel = {
    patient: "Patient",
    doctor:  "Doctor",
    clinic:  "Provider",
    admin:   "Administrator",
  }[role] || "User";

  const roleColor = {
    patient: "from-blue-600 to-cyan-500",
    doctor:  "from-emerald-600 to-teal-500",
    clinic:  "from-violet-600 to-purple-500",
    admin:   "from-rose-600 to-pink-500",
  }[role] || "from-blue-600 to-cyan-500";

  return (
    <div className="dashboard-layout min-h-screen">
      {/* ── SIDEBAR OVERLAY (mobile) ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── PREMIUM SIDEBAR ── */}
      <aside className={`glass-sidebar w-[280px] fixed top-0 left-0 h-screen z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center shadow-lg shadow-blue-900/50 animate-heartbeat`}>
            <HeartPulse size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-tight block tracking-wide">MedAssist AI</span>
            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">{roleLabel} Portal</span>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">{user?.full_name || "User"}</p>
              <p className="text-slate-400 text-xs truncate font-medium">{user?.email || ""}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 flex-1 overflow-y-auto">
          {navItems.map((section, si) => (
            <div key={si} className="mb-6">
              {section.label && (
                <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map(({ href, label, icon: Icon, badge }) => {
                  const active = pathname === href || pathname?.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`sidebar-nav-item ${active ? "active" : ""}`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="flex-1 font-semibold">{label}</span>
                      {badge !== undefined && badge > 0 && (
                        <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom branding */}
        <div className="px-6 py-5 border-t border-white/10 bg-slate-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">System Online</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
            HIPAA-aware · v2.0.0 · Enterprise
          </p>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="dashboard-content flex flex-col min-h-screen">
        
        {/* ── PREMIUM TOPBAR ── */}
        <header className="premium-topbar px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
          
          {/* Left: hamburger */}
          <div className="flex items-center gap-3">
            <button
              className="sidebar-toggle lg:hidden w-10 h-10 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Center: search bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, reports, symptoms…"
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Right: notifications, user menu */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative notif-container">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-10 h-10 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500">
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                </span>
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 rounded-2xl glass-panel p-4 z-50 shadow-2xl"
                  >
                    <p className="font-bold text-sm text-white mb-4">Notifications</p>
                    <div className="space-y-3">
                      <NotifItem title="System Ready" desc="All services are operational" time="Just now" type="success" />
                      <NotifItem title="Welcome to MedAssist AI" desc="Your dashboard is ready to use" time="1m ago" type="info" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div className="relative user-container">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-xs font-bold`}>
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-bold text-white max-w-[120px] truncate">
                  {user?.full_name?.split(" ")[0] || "User"}
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-14 w-60 rounded-2xl glass-panel p-2 z-50 shadow-2xl"
                  >
                    <div className="px-4 py-3 mb-2 border-b border-white/10">
                      <p className="font-bold text-sm text-white truncate">{user?.full_name}</p>
                      <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{user?.email}</p>
                    </div>
                    <Link href={`/${role}/profile`} className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-semibold transition-colors">
                      <User size={16} /> Profile
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold transition-colors mt-1"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 px-4 lg:px-8 py-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function NotifItem({ title, desc, time, type }) {
  const colors = {
    success: "bg-emerald-500 shadow-emerald-500/50",
    info:    "bg-blue-500 shadow-blue-500/50",
    warning: "bg-amber-500 shadow-amber-500/50",
    danger:  "bg-red-500 shadow-red-500/50",
  };
  return (
    <div className="flex gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-white/5 transition-colors cursor-pointer">
      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-lg ${colors[type] || colors.info}`} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-white truncate">{title}</p>
        <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-1 leading-relaxed">{desc}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">{time}</p>
      </div>
    </div>
  );
}
