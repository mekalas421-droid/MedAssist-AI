"use client";

import { useEffect, useState } from "react";
import {
  Activity, Users, Target, AlertTriangle, RefreshCw,
  TrendingUp, ShieldAlert, Download, Lightbulb
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import HeartbeatLine from "@/components/ui/HeartbeatLine";
import { useAuthStore } from "@/lib/authStore";
import { analyticsApi } from "@/lib/apiClient";
import { PROVIDER_NAV } from "../providerNav";


const RISK_COLORS = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#7f1d1d" };
const BAR_COLORS  = ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function ProviderDashboardPage() {
  const { user, isLoading, logout } = useAuthStore();

  const [system, setSystem] = useState(null);
  const [dist, setDist] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [symptomData, setSymptomData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [user, isLoading]);

  async function loadData() {
    setRefreshing(true);
    try {
      const [distRes, riskRes, sympRes, sysRes] = await Promise.allSettled([
        analyticsApi.diseaseDistribution(30),
        analyticsApi.riskDistribution(30),
        analyticsApi.symptomTrends(30),
        analyticsApi.systemOverview(),
      ]);
      if (distRes.status === "fulfilled") {
        setDist(distRes.value.data.data?.map(d => ({ name: d.disease, value: d.count })) || []);
      }
      if (riskRes.status === "fulfilled") {
        setRiskData(riskRes.value.data.data?.map(d => ({ name: d.risk_category?.toUpperCase(), value: d.count })) || []);
      }
      if (sympRes.status === "fulfilled") {
        setSymptomData(sympRes.value.data.data?.map(d => ({ name: d.symptom, value: d.count })) || []);
      }
      if (sysRes.status === "fulfilled") {
        setSystem(sysRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }

  function handleExportCSV() {
    const rows = [["Metric", "Value"]];
    if (system) {
      rows.push(["Total Patients", system.total_patients]);
      rows.push(["Total Submissions", system.total_symptom_submissions]);
      rows.push(["Total Predictions", system.total_predictions_generated]);
      rows.push(["Emergency Cases", system.emergency_cases_flagged]);
    }
    dist.forEach(d => rows.push([d.name, d.value]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "medassist_provider_report.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Provider Analytics..." /></div>;
  if (!user) return null;

  const navWithLogout = PROVIDER_NAV.map(section => ({
    ...section,
    items: section.items.map(item => item.label === "Logout" ? { ...item, href: "#", onClick: logout } : item),
  }));

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">

        <PageHeader 
          title="Hospital Analytics Hub"
          subtitle="Real-time epidemiological data and patient risk distribution."
          actions={
            <div className="flex gap-3">
              <AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}>
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
              </AnimatedButton>
              <AnimatedButton onClick={handleExportCSV} icon={Download}>
                Export CSV
              </AnimatedButton>
            </div>
          }
        />

        {/* ── WELCOME HERO (PREMIUM) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden p-8 lg:p-10 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #3730a3 0%, #4338ca 60%, #7c3aed 100%)" }}
        >
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa] animate-pulse" />
                <span className="text-violet-300 text-xs font-bold uppercase tracking-widest">Enterprise Network Live</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                Data-Driven <br/>
                <span className="text-violet-300">Healthcare Delivery.</span>
              </h1>
            </div>

            {/* Quick Metrics */}
            <div className="shrink-0 flex gap-4">
              {[
                { label: "Total Patients",    value: system?.total_patients ?? "—",            color: "from-blue-600 to-cyan-500" },
                { label: "AI Predictions", value: system?.total_predictions_generated ?? "—",  color: "from-violet-600 to-purple-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-6 bg-slate-900/40 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl text-center min-w-[140px]">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-3`}>
                    <Activity size={20} className="text-white" />
                  </div>
                  <p className="text-white text-3xl font-extrabold">{value}</p>
                  <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 opacity-30">
            <HeartbeatLine color="#a78bfa" height={40} className="w-full" />
          </div>
        </motion.div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Active Patients" value={system?.total_patients ?? 0} color="blue" delay={0.1} />
          <StatCard icon={Activity} label="Triage Submissions" value={system?.total_symptom_submissions ?? 0} color="purple" delay={0.2} />
          <StatCard icon={Target} label="AI Diagnostics" value={system?.total_predictions_generated ?? 0} color="emerald" delay={0.3} />
          <StatCard icon={AlertTriangle} label="Emergency Flags" value={system?.emergency_cases_flagged ?? 0} color="rose" delay={0.4} />
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Disease Distribution */}
          <PremiumCard className="p-6 h-[400px] flex flex-col">
            <h3 className="font-bold text-lg text-white">Disease Distribution</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Top predicted conditions across network (30 days)</p>
            <div className="flex-1">
              {dist.length === 0 ? (
                <EmptyState icon={TrendingUp} title="No Data" description="Not enough reports generated." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dist.slice(0, 7)} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#E2E8F0", fontWeight: "bold" }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", fontSize: 12 }} itemStyle={{ color: "#fff", fontWeight: "bold" }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Cases">
                      {dist.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </PremiumCard>

          {/* Risk Distribution Donut */}
          <PremiumCard className="p-6 h-[400px] flex flex-col">
            <h3 className="font-bold text-lg text-white">Risk Level Distribution</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Patient triage category breakdown</p>
            <div className="flex-1">
              {riskData.length === 0 ? (
                <EmptyState icon={ShieldAlert} title="No Data" description="Not enough reports generated." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData} dataKey="value" nameKey="name"
                      innerRadius={80} outerRadius={120} paddingAngle={4} stroke="none"
                    >
                      {riskData.map((entry, i) => (
                        <Cell key={i} fill={RISK_COLORS[entry.name] || "#3b82f6"} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: "bold", color: "#E2E8F0" }} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", fontSize: 12 }} itemStyle={{ color: "#fff", fontWeight: "bold" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </PremiumCard>
        </div>

        {/* ── SYMPTOM TRENDS ── */}
        {symptomData.length > 0 && (
          <PremiumCard className="p-6 h-[400px]">
            <h3 className="font-bold text-lg text-white">Symptom Frequency</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Total occurrences logged by triage engine</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={symptomData.slice(0, 10)} margin={{ top: 5, right: 10, bottom: 30, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#E2E8F0", fontWeight: "bold" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} itemStyle={{ color: "#a855f7", fontWeight: "bold" }} />
                <Bar dataKey="value" fill="url(#symptomGrad)" radius={[8, 8, 0, 0]} name="Reports" />
                <defs>
                  <linearGradient id="symptomGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </PremiumCard>
        )}

        {/* ── AI INSIGHTS PANEL ── */}
        <PremiumCard className="p-6">
          <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-3">
            <Lightbulb size={20} className="text-amber-400" /> AI Insights & Recommendations
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
              <p className="text-2xl mb-3">🚨</p>
              <h4 className="font-bold text-white mb-2">High-Risk Monitoring</h4>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">{system?.emergency_cases_flagged ?? 0} emergency cases flagged across network. Prioritize clinical resources.</p>
            </div>
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-2xl mb-3">🔬</p>
              <h4 className="font-bold text-white mb-2">Prevalence Alert</h4>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">{dist[0] ? `"${dist[0].name}" is the most frequently predicted condition.` : "Analyzing real-time disease vectors."}</p>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-2xl mb-3">⚡</p>
              <h4 className="font-bold text-white mb-2">Triage Efficiency</h4>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">{system?.total_predictions_generated ?? 0} AI predictions generated, accelerating initial assessments.</p>
            </div>
          </div>
        </PremiumCard>

      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  const gradients = {
    emerald: "from-emerald-600 to-teal-500",
    blue: "from-blue-600 to-cyan-500",
    rose: "from-rose-600 to-pink-500",
    amber: "from-amber-500 to-orange-400",
    purple: "from-violet-600 to-purple-500",
  };
  return (
    <PremiumCard delay={delay} className="p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-extrabold text-white mt-1 capitalize">{value}</p>
      </div>
    </PremiumCard>
  );
}
