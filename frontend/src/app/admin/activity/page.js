"use client";

import { useEffect, useState } from "react";
import { ScrollText, Search, RefreshCw, Activity } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

export default function AdminActivityPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(logs.filter(l => l.action?.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q)));
  }, [search, logs]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await adminApi.activityLogs();
      setLogs(res.data || []);
      setFiltered(res.data || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Activity Logs..." /></div>;
  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Activity Logs"
          subtitle={`${logs.length} system activity events recorded.`}
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Activity Logs" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Total Events", value: logs.length, color: "from-blue-600 to-cyan-500" },
            { label: "Today", value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: "from-emerald-600 to-teal-500" },
            { label: "Filtered", value: filtered.length, color: "from-violet-600 to-purple-500" },
          ].map(({ label, value, color }, i) => (
            <PremiumCard key={label} delay={i * 0.06} className="p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
              <p className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</p>
            </PremiumCard>
          ))}
        </div>

        {/* Search */}
        <PremiumCard className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search action or details..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
          </div>
        </PremiumCard>

        {/* Log List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <PremiumCard className="p-8"><EmptyState icon={ScrollText} title="No Activity Logs" description={search ? "No results match." : "No activity has been recorded yet."} /></PremiumCard>
          ) : filtered.map((log, i) => (
            <PremiumCard key={log.id || i} delay={i * 0.02} className="p-4">
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0"><Activity size={16} className="text-blue-400" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm">{log.action}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest shrink-0 ml-4">{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</p>
                  </div>
                  {log.details && <p className="text-xs text-slate-400 font-mono leading-relaxed">{log.details}</p>}
                  {log.user_id && <p className="text-[10px] text-slate-600 font-mono mt-1">User: {log.user_id}</p>}
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
