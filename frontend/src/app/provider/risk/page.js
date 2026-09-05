"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw, Download } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { analyticsApi } from "@/lib/apiClient";
import { PROVIDER_NAV } from "../providerNav";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const RISK_CONFIG = {
  LOW:      { color: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  MEDIUM:   { color: "#f59e0b", bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
  HIGH:     { color: "#ef4444", bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20" },
  CRITICAL: { color: "#7c3aed", bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20" },
};

export default function RiskAnalyticsPage() {
  const { user, isLoading } = useAuthStore();
  const [riskData, setRiskData] = useState([]);
  const [system, setSystem] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);

  async function loadData() {
    setRefreshing(true);
    try {
      const [riskRes, sysRes] = await Promise.allSettled([
        analyticsApi.riskDistribution(30),
        analyticsApi.systemOverview(),
      ]);
      if (riskRes.status === "fulfilled") {
        setRiskData(riskRes.value.data.data?.map(d => ({ name: d.risk_category?.toUpperCase(), value: d.count })) || []);
      }
      if (sysRes.status === "fulfilled") setSystem(sysRes.value.data);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Risk Analysis..." /></div>;

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));
  const total = riskData.reduce((s, d) => s + d.value, 0);
  const emergency = system?.emergency_cases_flagged ?? 0;

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Risk Analysis"
          subtitle="Population health risk stratification and triage intelligence."
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Risk Analysis" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {/* Critical banner */}
        {emergency > 0 && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4">
            <ShieldAlert className="text-red-400 shrink-0" size={28} />
            <div>
              <p className="font-bold text-white">🚨 {emergency} Emergency Case{emergency !== 1 ? "s" : ""} Flagged</p>
              <p className="text-sm text-red-300 font-medium">Immediate clinical review recommended for critical patients.</p>
            </div>
          </div>
        )}

        {/* Risk Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {riskData.map(({ name, value }, i) => {
            const cfg = RISK_CONFIG[name] || { color: "#6366f1", bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" };
            const pct = total ? ((value / total) * 100).toFixed(1) : 0;
            return (
              <PremiumCard key={name} delay={i * 0.08} className={`p-5 border ${cfg.border} ${cfg.bg}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${cfg.text}`}>{name} RISK</p>
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className={`text-sm font-bold ${cfg.text} mt-1`}>{pct}% of total</p>
              </PremiumCard>
            );
          })}
          {riskData.length === 0 && <div className="col-span-4"><EmptyState icon={ShieldAlert} title="No Risk Data" description="Triage data will appear once submissions are processed." /></div>}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <PremiumCard className="p-6">
            <h3 className="font-bold text-lg text-white mb-6">Risk Level Distribution</h3>
            {riskData.length === 0 ? <EmptyState icon={ShieldAlert} title="No Data" description="No triage data available." /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={75} outerRadius={115} paddingAngle={4} stroke="none">
                    {riskData.map((entry) => <Cell key={entry.name} fill={RISK_CONFIG[entry.name]?.color || "#6366f1"} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: "bold", color: "#E2E8F0" }} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.95)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </PremiumCard>

          {/* Summary panel */}
          <PremiumCard className="p-6 flex flex-col justify-between">
            <h3 className="font-bold text-lg text-white mb-6">Clinical Intelligence</h3>
            <div className="space-y-4 flex-1">
              {[
                { label: "Total Triaged Patients", value: total, desc: "across all risk levels" },
                { label: "Emergency Cases", value: emergency, desc: "require immediate attention" },
                { label: "AI Predictions Generated", value: system?.total_predictions_generated ?? 0, desc: "from triage submissions" },
                { label: "Triage Submissions", value: system?.total_symptom_submissions ?? 0, desc: "processed by AI engine" },
              ].map(({ label, value, desc }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-slate-400 font-medium">{desc}</p>
                  </div>
                  <p className="text-xl font-extrabold text-white">{value}</p>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>
      </div>
    </DashboardShell>
  );
}
