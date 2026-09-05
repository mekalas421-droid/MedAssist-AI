"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Download, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { analyticsApi } from "@/lib/apiClient";
import { PROVIDER_NAV } from "../providerNav";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

export default function DiseaseAnalyticsPage() {
  const { user, isLoading } = useAuthStore();
  const [dist30, setDist30] = useState([]);
  const [dist90, setDist90] = useState([]);
  const [tab, setTab] = useState("30");
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);

  async function loadData() {
    setRefreshing(true);
    try {
      const [r30, r90] = await Promise.allSettled([
        analyticsApi.diseaseDistribution(30),
        analyticsApi.diseaseDistribution(90),
      ]);
      if (r30.status === "fulfilled") setDist30(r30.value.data.data?.map(d => ({ name: d.disease, count: d.count })) || []);
      if (r90.status === "fulfilled") setDist90(r90.value.data.data?.map(d => ({ name: d.disease, count: d.count })) || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  function handleExport() {
    const data = tab === "30" ? dist30 : dist90;
    const csv = ["Disease,Cases", ...data.map(d => `${d.name},${d.count}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `disease_analytics_${tab}d.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Disease Analytics..." /></div>;

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));
  const activeData = tab === "30" ? dist30 : dist90;

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Disease Analytics"
          subtitle="Epidemiological distribution of AI-predicted conditions across the network."
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Disease Analytics" }]}
          actions={
            <div className="flex gap-3">
              <AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}>
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
              </AnimatedButton>
              <AnimatedButton onClick={handleExport} icon={Download}>Export CSV</AnimatedButton>
            </div>
          }
        />

        {/* Time range tabs */}
        <div className="flex gap-2">
          {["30", "90"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${tab === t ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20" : "bg-slate-800/30 text-slate-400 border-white/5 hover:text-white"}`}>
              Last {t} days
            </button>
          ))}
        </div>

        {/* Bar Chart */}
        <PremiumCard className="p-6">
          <h3 className="font-bold text-lg text-white mb-1">Case Volume by Disease</h3>
          <p className="text-xs text-slate-400 font-medium mb-6">Top predicted conditions — last {tab} days</p>
          {activeData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No Data" description="No AI predictions generated in this period yet." />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={activeData.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#E2E8F0", fontWeight: "bold" }} axisLine={false} tickLine={false} width={140} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.95)", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} itemStyle={{ color: "#a78bfa" }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} name="Cases">
                  {activeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </PremiumCard>

        {/* Disease Table */}
        <PremiumCard className="p-6 overflow-hidden">
          <h3 className="font-bold text-lg text-white mb-4">Detailed Breakdown</h3>
          {activeData.length === 0 ? null : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-4">#</th>
                    <th className="p-4">Condition</th>
                    <th className="p-4">Cases</th>
                    <th className="p-4">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-800/20">
                  {activeData.map((d, i) => {
                    const total = activeData.reduce((sum, x) => sum + x.count, 0);
                    const pct = total ? ((d.count / total) * 100).toFixed(1) : 0;
                    return (
                      <tr key={d.name} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 text-slate-500 font-bold">{i + 1}</td>
                        <td className="p-4 font-bold text-white">{d.name}</td>
                        <td className="p-4 font-bold text-white">{d.count}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 w-10 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PremiumCard>
      </div>
    </DashboardShell>
  );
}
