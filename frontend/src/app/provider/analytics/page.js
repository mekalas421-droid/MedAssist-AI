"use client";

import { useEffect, useState } from "react";
import { BarChart3, RefreshCw, TrendingUp, Activity } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { analyticsApi } from "@/lib/apiClient";
import { PROVIDER_NAV } from "../providerNav";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";

export default function AnalyticsHubPage() {
  const { user, isLoading } = useAuthStore();
  const [trends, setTrends] = useState([]);
  const [dist, setDist] = useState([]);
  const [risk, setRisk] = useState([]);
  const [system, setSystem] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);

  async function loadData() {
    setRefreshing(true);
    try {
      const [tRes, dRes, rRes, sRes] = await Promise.allSettled([
        analyticsApi.symptomTrends(30),
        analyticsApi.diseaseDistribution(30),
        analyticsApi.riskDistribution(30),
        analyticsApi.systemOverview(),
      ]);
      if (tRes.status === "fulfilled") setTrends(tRes.value.data.data?.map(d => ({ date: d.date?.slice(5), submissions: d.count })) || []);
      if (dRes.status === "fulfilled") setDist(dRes.value.data.data?.map(d => ({ name: d.disease?.slice(0, 12), count: d.count })) || []);
      if (rRes.status === "fulfilled") setRisk(rRes.value.data.data?.map(d => ({ name: d.risk_category?.toUpperCase(), value: d.count })) || []);
      if (sRes.status === "fulfilled") setSystem(sRes.value.data);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Analytics Hub..." /></div>;

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Analytics Hub"
          subtitle="Full-spectrum clinical intelligence dashboard."
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Analytics Hub" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Patients", value: system?.total_patients ?? 0, gradient: "from-blue-600 to-cyan-500" },
            { label: "AI Predictions", value: system?.total_predictions_generated ?? 0, gradient: "from-violet-600 to-purple-500" },
            { label: "Symptom Submissions", value: system?.total_symptom_submissions ?? 0, gradient: "from-emerald-600 to-teal-500" },
            { label: "Emergency Flags", value: system?.emergency_cases_flagged ?? 0, gradient: "from-rose-600 to-pink-500" },
          ].map(({ label, value, gradient }, i) => (
            <PremiumCard key={label} delay={i * 0.07} className="p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
              <p className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>{value}</p>
            </PremiumCard>
          ))}
        </div>

        {/* Triage trend */}
        <PremiumCard className="p-6">
          <h3 className="font-bold text-lg text-white mb-1">Triage Submission Trend</h3>
          <p className="text-xs text-slate-400 font-medium mb-6">Daily symptom submissions — last 30 days</p>
          {trends.length === 0 ? (
            <EmptyState icon={Activity} title="No Trend Data" description="Triage data will populate over time." />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trends} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.95)", fontSize: 12 }} itemStyle={{ color: "#22d3ee" }} />
                <Area type="monotone" dataKey="submissions" stroke="#06b6d4" strokeWidth={2} fill="url(#trendGrad)" name="Submissions" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </PremiumCard>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Disease top 5 */}
          <PremiumCard className="p-6">
            <h3 className="font-bold text-lg text-white mb-6">Top 5 Predicted Diseases</h3>
            {dist.length === 0 ? <EmptyState icon={TrendingUp} title="No Data" description="AI predictions not yet generated." /> : (
              <div className="space-y-3">
                {dist.slice(0, 5).map((d, i) => {
                  const max = dist[0].count;
                  const pct = max ? (d.count / max) * 100 : 0;
                  const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];
                  return (
                    <div key={d.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-bold text-white">{d.name}</span>
                        <span className="text-xs font-bold text-slate-400">{d.count} cases</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PremiumCard>

          {/* Risk distribution */}
          <PremiumCard className="p-6">
            <h3 className="font-bold text-lg text-white mb-6">Risk Stratification</h3>
            {risk.length === 0 ? <EmptyState icon={BarChart3} title="No Data" description="Risk data will appear once triage is complete." /> : (
              <div className="space-y-4">
                {risk.map((r) => {
                  const colors = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#7c3aed" };
                  const total = risk.reduce((s, x) => s + x.value, 0);
                  const pct = total ? ((r.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={r.name} className="p-4 rounded-xl border border-white/5 bg-slate-800/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: colors[r.name] || "#6366f1" }} />
                        <span className="font-bold text-white text-sm">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[r.name] || "#6366f1" }} />
                        </div>
                        <span className="text-sm font-bold text-white w-10 text-right">{r.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PremiumCard>
        </div>
      </div>
    </DashboardShell>
  );
}
