"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, RefreshCw, Shield } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

const ACTION_COLOR = {
  LOGIN: "bg-emerald-500/20 text-emerald-400",
  REGISTER: "bg-blue-500/20 text-blue-400",
  LOGOUT: "bg-slate-500/20 text-slate-400",
  DELETE: "bg-red-500/20 text-red-400",
  UPDATE: "bg-amber-500/20 text-amber-400",
  CREATE: "bg-indigo-500/20 text-indigo-400",
};

function actionColor(action) {
  const key = Object.keys(ACTION_COLOR).find(k => action?.toUpperCase().startsWith(k));
  return key ? ACTION_COLOR[key] : "bg-slate-500/20 text-slate-400";
}

export default function AdminAuditPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(logs.filter(l => l.action?.toLowerCase().includes(q) || l.resource_type?.toLowerCase().includes(q)));
  }, [search, logs]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await adminApi.auditLogs();
      setLogs(res.data || []);
      setFiltered(res.data || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Audit Logs..." /></div>;
  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Audit Logs"
          subtitle={`${logs.length} security and compliance events.`}
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Audit Logs" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Total Events", value: logs.length, color: "from-indigo-600 to-blue-500" },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search action or resource type..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
          </div>
        </PremiumCard>

        {/* Audit Table */}
        <PremiumCard className="p-0 overflow-hidden">
          {filtered.length === 0 ? <div className="p-8"><EmptyState icon={ClipboardList} title="No Audit Logs" description={search ? "No results match." : "No audit events recorded yet."} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <tr><th className="p-4">Action</th><th className="p-4">Resource</th><th className="p-4">Resource ID</th><th className="p-4">User ID</th><th className="p-4">Timestamp</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-800/20">
                  {filtered.map((log, i) => (
                    <tr key={log.id || i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${actionColor(log.action)}`}>
                          <Shield size={9} /> {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-xs font-bold">{log.resource_type || "—"}</td>
                      <td className="p-4 font-mono text-slate-500 text-[10px]">{log.resource_id ? (log.resource_id + "").substring(0, 13) + "…" : "—"}</td>
                      <td className="p-4 font-mono text-slate-500 text-[10px]">{log.user_id ? (log.user_id + "").substring(0, 13) + "…" : "—"}</td>
                      <td className="p-4 text-slate-400 text-xs font-medium">{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PremiumCard>
      </div>
    </DashboardShell>
  );
}
