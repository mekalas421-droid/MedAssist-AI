"use client";

import { useEffect, useState } from "react";
import { BarChart3, RefreshCw, ShieldAlert, Activity } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi, analyticsApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#7c3aed"];
const BAR_COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminAnalyticsPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [system, setSystem] = useState(null);
  const [users, setUsers] = useState([]);
  const [dist30, setDist30] = useState([]);
  const [dist90, setDist90] = useState([]);
  const [risk, setRisk] = useState([]);
  const [trends, setTrends] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("30");

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);

  async function loadData() {
    setRefreshing(true);
    try {
      const [sysR, usersR, d30R, d90R, riskR, trendR] = await Promise.allSettled([
        analyticsApi.systemOverview(),
        adminApi.listUsers(),
        analyticsApi.diseaseDistribution(30),
        analyticsApi.diseaseDistribution(90),
        analyticsApi.riskDistribution(30),
        analyticsApi.symptomTrends(30),
      ]);
      if (sysR.status === "fulfilled") setSystem(sysR.value.data);
      if (usersR.status === "fulfilled") setUsers(usersR.value.data || []);
      if (d30R.status === "fulfilled") setDist30(d30R.value.data.data?.map(d => ({ name: d.disease?.slice(0, 14), count: d.count })) || []);
      if (d90R.status === "fulfilled") setDist90(d90R.value.data.data?.map(d => ({ name: d.disease?.slice(0, 14), count: d.count })) || []);
      if (riskR.status === "fulfilled") setRisk(riskR.value.data.data?.map(d => ({ name: d.risk_category?.toUpperCase(), value: d.count })) || []);
      if (trendR.status === "fulfilled") setTrends(trendR.value.data.data?.map(d => ({ name: d.symptom?.slice(0, 14), count: d.count })) || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Analytics..." /></div>;

  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));
  const activeData = tab === "30" ? dist30 : dist90;
  const roleData = [
    { name: "Patients", value: users.filter(u => u.role === "patient").length },
    { name: "Doctors", value: users.filter(u => u.role === "doctor").length },
    { name: "Providers", value: users.filter(u => u.role === "clinic").length },
    { name: "Admins", value: users.filter(u => u.role === "admin").length },
  ];

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="System Analytics"
          subtitle="Full-spectrum intelligence: disease trends, risk distribution, AI metrics."
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Analytics" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: users.length, color: "from-indigo-600 to-blue-500" },
            { label: "AI Predictions", value: system?.total_predictions_generated ?? 0, color: "from-violet-600 to-purple-500" },
            { label: "Triage Submissions", value: system?.total_symptom_submissions ?? 0, color: "from-emerald-600 to-teal-500" },
            { label: "Emergency Flags", value: system?.emergency_cases_flagged ?? 0, color: "from-rose-600 to-pink-500" },
          ].map(({ label, value, color }, i) => (
            <PremiumCard key={label} delay={i * 0.07} className="p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
              <p className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</p>
            </PremiumCard>
          ))}
        </div>

        {/* Disease Distribution */}
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-white">Disease Distribution</h3>
              <p className="text-xs text-slate-400 font-medium">Top predicted conditions by case volume</p>
            </div>
            <div className="flex gap-2">
              {["30", "90"].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${tab === t ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-800/30 text-slate-400 border-white/5 hover:text-white"}`}>{t}d</button>
              ))}
            </div>
          </div>
          {activeData.length === 0 ? <EmptyState icon={BarChart3} title="No Data" description="No AI predictions generated yet." /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activeData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#E2E8F0", fontWeight: "bold" }} axisLine={false} tickLine={false} width={140} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.95)", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} name="Cases">
                  {activeData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </PremiumCard>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <PremiumCard className="p-6">
            <h3 className="font-bold text-lg text-white mb-1">Risk Stratification</h3>
            <p className="text-xs text-slate-400 font-medium mb-5">Patient risk levels (last 30d)</p>
            {risk.length === 0 ? <EmptyState icon={ShieldAlert} title="No Data" description="No triage data yet." /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={risk} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4} stroke="none">
                    {risk.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: "bold", color: "#E2E8F0" }} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.95)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </PremiumCard>

          {/* User Roles */}
          <PremiumCard className="p-6">
            <h3 className="font-bold text-lg text-white mb-1">User Role Distribution</h3>
            <p className="text-xs text-slate-400 font-medium mb-5">RBAC breakdown across {users.length} users</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4} stroke="none">
                  {roleData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: "bold", color: "#E2E8F0" }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.95)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </PremiumCard>
        </div>

        {/* Top Symptoms */}
        <PremiumCard className="p-6">
          <h3 className="font-bold text-lg text-white mb-1">Top Reported Symptoms</h3>
          <p className="text-xs text-slate-400 font-medium mb-6">Most frequent symptoms (last 30d)</p>
          {trends.length === 0 ? <EmptyState icon={Activity} title="No Data" description="No symptom submissions yet." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends.slice(0, 10)} margin={{ top: 5, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.95)", fontSize: 12 }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Reports">
                  {trends.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </PremiumCard>
      </div>
    </DashboardShell>
  );
}
