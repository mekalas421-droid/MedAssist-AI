"use client";

import { useEffect, useState } from "react";
import { Bell, RefreshCw, CheckCircle, Search } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { notificationApi } from "@/lib/apiClient";
import { PROVIDER_NAV } from "../providerNav";

export default function ProviderNotificationsPage() {
  const { user, isLoading } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(notifications.filter(n => n.message?.toLowerCase().includes(q)));
  }, [search, notifications]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await notificationApi.myNotifications();
      const notifList = res.data || [];
      setNotifications(notifList);
      setFiltered(notifList);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  async function markAsRead(id) {
    try {
      await notificationApi.markRead(id);
      loadData();
    } catch (e) { console.error(e); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Notifications..." /></div>;

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Notifications & Alerts"
          subtitle="System alerts, updates, and messages for your clinic."
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Notifications" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {/* Summary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Notifications", value: notifications.length, color: "from-blue-600 to-cyan-500" },
            { label: "Unread", value: unreadCount, color: "from-emerald-600 to-teal-500" },
            { label: "Read", value: notifications.filter(n => n.is_read).length, color: "from-violet-600 to-purple-500" },
            { label: "Filtered", value: filtered.length, color: "from-amber-500 to-orange-400" },
          ].map(({ label, value, color }, i) => (
            <PremiumCard key={label} delay={i * 0.06} className="p-5">
              <div className={`text-2xl font-extrabold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </PremiumCard>
          ))}
        </div>

        {/* Search */}
        <PremiumCard className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 font-medium"
            />
          </div>
        </PremiumCard>

        {/* List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <PremiumCard className="p-6">
              <EmptyState icon={Bell} title="No Notifications" description={search ? "No results match your search." : "You're all caught up."} />
            </PremiumCard>
          ) : (
            filtered.map((n, i) => (
              <PremiumCard key={n.id || i} delay={i * 0.05} className={`p-4 sm:p-6 transition-colors border ${n.is_read ? 'border-white/5 opacity-80' : 'border-blue-500/30 bg-blue-500/5'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${n.is_read ? 'bg-slate-800 text-slate-400' : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'}`}>
                    <Bell size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : "Unknown Time"}
                      </span>
                    </div>
                    <p className={`text-sm ${n.is_read ? 'text-slate-300 font-medium' : 'text-white font-bold'}`}>{n.message}</p>
                  </div>
                  <div className="shrink-0 flex items-center justify-end mt-4 sm:mt-0">
                    {!n.is_read ? (
                      <AnimatedButton variant="secondary" onClick={() => markAsRead(n.id)} className="py-2 px-4 text-xs">
                        <CheckCircle size={14} /> Mark Read
                      </AnimatedButton>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500">
                        <CheckCircle size={14} /> Read
                      </span>
                    )}
                  </div>
                </div>
              </PremiumCard>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
