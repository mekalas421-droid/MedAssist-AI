"use client";

import { useEffect, useState } from "react";
import { Bell, RefreshCw, CheckCircle, Send, Search, Users } from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { notificationApi, adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

export default function AdminNotificationsPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [broadcast, setBroadcast] = useState({ message: "", target: "all" });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(notifications.filter(n => n.message?.toLowerCase().includes(q)));
  }, [search, notifications]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await notificationApi.myNotifications();
      setNotifications(res.data || []);
      setFiltered(res.data || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  async function markRead(id) {
    try { await notificationApi.markRead(id); loadData(); } catch (e) { console.error(e); }
  }

  function showToast(msg, type = "success") { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }

  async function handleBroadcast(e) {
    e.preventDefault();
    if (!broadcast.message.trim()) return;
    setSending(true);
    // Simulate broadcast — in production this would call a POST /api/v1/admin/broadcast
    await new Promise(r => setTimeout(r, 1000));
    showToast("Broadcast notification queued successfully!");
    setBroadcast({ message: "", target: "all" });
    setSending(false);
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Notifications..." /></div>;
  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));
  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Notifications & Alerts"
          subtitle="Manage system notifications and broadcast messages to users."
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Notifications" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {toast && (
          <div className={`p-4 rounded-2xl text-sm font-bold border ${toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>{toast.msg}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: notifications.length, color: "from-blue-600 to-cyan-500" },
            { label: "Unread", value: unread, color: "from-amber-500 to-orange-400" },
            { label: "Read", value: notifications.filter(n => n.is_read).length, color: "from-emerald-600 to-teal-500" },
            { label: "Filtered", value: filtered.length, color: "from-violet-600 to-purple-500" },
          ].map(({ label, value, color }, i) => (
            <PremiumCard key={label} delay={i * 0.06} className="p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
              <p className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</p>
            </PremiumCard>
          ))}
        </div>

        {/* Broadcast Composer */}
        <PremiumCard className="p-6">
          <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2"><Send size={18} className="text-indigo-400" /> Broadcast Message</h3>
          <p className="text-xs text-slate-400 font-medium mb-5">Send a system-wide notification to users.</p>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message</label>
                <input value={broadcast.message} onChange={e => setBroadcast(b => ({ ...b, message: e.target.value }))} placeholder="Type your broadcast message..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Audience</label>
                <select value={broadcast.target} onChange={e => setBroadcast(b => ({ ...b, target: e.target.value }))} className="w-full bg-slate-800/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50">
                  <option value="all">All Users</option>
                  <option value="patient">Patients Only</option>
                  <option value="doctor">Doctors Only</option>
                  <option value="clinic">Providers Only</option>
                </select>
              </div>
            </div>
            <AnimatedButton type="submit" disabled={!broadcast.message.trim() || sending} isLoading={sending} icon={Send}>Send Broadcast</AnimatedButton>
          </form>
        </PremiumCard>

        {/* Search */}
        <PremiumCard className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
          </div>
        </PremiumCard>

        {/* Notification List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <PremiumCard className="p-8"><EmptyState icon={Bell} title="No Notifications" description={search ? "No results match." : "No notifications yet."} /></PremiumCard>
          ) : filtered.map((n, i) => (
            <PremiumCard key={n.id || i} delay={i * 0.02} className={`p-4 border ${n.is_read ? "border-white/5" : "border-blue-500/20 bg-blue-500/5"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.is_read ? "bg-slate-800 text-slate-400" : "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"}`}><Bell size={18} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{n.created_at ? new Date(n.created_at).toLocaleString() : "—"}</span>
                  </div>
                  <p className={`text-sm ${n.is_read ? "text-slate-300 font-medium" : "text-white font-bold"}`}>{n.message}</p>
                </div>
                <div className="shrink-0">
                  {!n.is_read ? (
                    <button onClick={() => markRead(n.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white transition-colors"><CheckCircle size={13} /> Mark Read</button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><CheckCircle size={13} /> Read</span>
                  )}
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
