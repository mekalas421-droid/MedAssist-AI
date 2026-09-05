"use client";

import { useEffect, useState } from "react";
import { FileText, Search, RefreshCw, Download } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

export default function AdminReportsPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(reports.filter(r => r.patient_id?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q)));
  }, [search, reports]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await adminApi.allReports();
      setReports(res.data || []);
      setFiltered(res.data || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  function exportCSV() {
    const csv = ["ID,Patient ID,Generated At", ...reports.map(r => `${r.id},${r.patient_id},${r.generated_at}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "health_reports.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Reports..." /></div>;
  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));

  const thisMonth = reports.filter(r => new Date(r.generated_at) >= new Date(new Date().setDate(1))).length;
  const thisWeek = reports.filter(r => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return new Date(r.generated_at) >= d;
  }).length;

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Health Reports"
          subtitle={`${reports.length} AI-generated health reports across all patients.`}
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Reports" }]}
          actions={
            <div className="flex gap-3">
              <AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>
              <AnimatedButton onClick={exportCSV} icon={Download}>Export CSV</AnimatedButton>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reports", value: reports.length, color: "from-blue-600 to-cyan-500" },
            { label: "This Month", value: thisMonth, color: "from-emerald-600 to-teal-500" },
            { label: "This Week", value: thisWeek, color: "from-violet-600 to-purple-500" },
            { label: "Today", value: reports.filter(r => new Date(r.generated_at).toDateString() === new Date().toDateString()).length, color: "from-amber-500 to-orange-400" },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by report ID or patient ID..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
          </div>
        </PremiumCard>

        {/* Table */}
        <PremiumCard className="p-0 overflow-hidden">
          {filtered.length === 0 ? <div className="p-8"><EmptyState icon={FileText} title="No Reports Found" description={search ? "No results match." : "No reports have been generated yet."} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <tr><th className="p-4">#</th><th className="p-4">Report ID</th><th className="p-4">Patient ID</th><th className="p-4">Generated</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-800/20">
                  {filtered.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-slate-500 font-bold">{i + 1}</td>
                      <td className="p-4 font-mono text-slate-300 text-xs">{(r.id || "").substring(0, 16)}…</td>
                      <td className="p-4 font-mono text-slate-400 text-xs">{(r.patient_id || "").substring(0, 16)}…</td>
                      <td className="p-4 text-slate-400 text-xs font-medium">{r.generated_at ? new Date(r.generated_at).toLocaleString() : "—"}</td>
                      <td className="p-4 text-right">
                        <button className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"><Download size={15} /></button>
                      </td>
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
