"use client";

import { useEffect, useState } from "react";
import { Building, Users, Activity, Target, AlertTriangle, TrendingUp, MapPin, Phone, Globe } from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/authStore";
import { analyticsApi } from "@/lib/apiClient";
import { PROVIDER_NAV } from "../providerNav";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function ProviderOverviewPage() {
  const { user, isLoading } = useAuthStore();
  const [system, setSystem] = useState(null);
  const [dist, setDist] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) loadData();
  }, [user, isLoading]);

  async function loadData() {
    try {
      const [sysRes, distRes] = await Promise.allSettled([
        analyticsApi.systemOverview(),
        analyticsApi.diseaseDistribution(90),
      ]);
      if (sysRes.status === "fulfilled") setSystem(sysRes.value.data);
      if (distRes.status === "fulfilled") setDist(distRes.value.data.data?.map(d => ({ name: d.disease, value: d.count })) || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Hospital Overview..." /></div>;

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));

  const metrics = [
    { label: "Total Patients", value: system?.total_patients ?? 0, icon: Users, color: "from-blue-600 to-cyan-500" },
    { label: "AI Predictions", value: system?.total_predictions_generated ?? 0, icon: Target, color: "from-violet-600 to-purple-500" },
    { label: "Triage Submissions", value: system?.total_symptom_submissions ?? 0, icon: Activity, color: "from-emerald-600 to-teal-500" },
    { label: "Emergency Flags", value: system?.emergency_cases_flagged ?? 0, icon: AlertTriangle, color: "from-rose-600 to-pink-500" },
  ];

  const trend = dist.slice(0, 7).map((d, i) => ({ label: d.name?.slice(0, 10), cases: d.value }));

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Hospital Overview"
          subtitle="Comprehensive snapshot of your facility's operational health."
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Overview" }]}
        />

        {/* Hero banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden p-8 lg:p-10 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #312e81 0%, #4338ca 60%, #6d28d9 100%)" }}>
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Facility Report</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Network Health Summary</h2>
              <p className="text-indigo-200 text-sm font-medium max-w-xl">
                Aggregated clinical intelligence from {system?.total_patients ?? 0} registered patients across the network.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-indigo-950/50 border border-indigo-500/20 flex flex-col items-center justify-center shadow-xl">
                <Building size={32} className="text-indigo-300 mb-1" />
                <span className="text-white text-xs font-bold">Facility</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(({ label, value, icon: Icon, color }, i) => (
            <PremiumCard key={label} delay={i * 0.08} className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
              </div>
            </PremiumCard>
          ))}
        </div>

        {/* Trend Chart */}
        <PremiumCard className="p-6">
          <h3 className="font-bold text-lg text-white mb-1">Disease Case Volume</h3>
          <p className="text-xs text-slate-400 font-medium mb-6">Top predicted conditions across the network</p>
          {trend.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No Data Yet" description="Case data will appear once AI predictions are generated." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 20, left: -20 }}>
                <defs>
                  <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.95)", fontSize: 12 }} itemStyle={{ color: "#818cf8" }} />
                <Area type="monotone" dataKey="cases" stroke="#6366f1" strokeWidth={2} fill="url(#overviewGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </PremiumCard>

        {/* Facility Info Card */}
        <PremiumCard className="p-6">
          <h3 className="font-bold text-lg text-white mb-6">Facility Information</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Building, label: "Facility Name", value: user?.full_name || "Healthcare Provider" },
              { icon: MapPin, label: "Service Region", value: "Multi-City Network" },
              { icon: Globe, label: "Network Type", value: "Enterprise Healthcare" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-4 rounded-2xl bg-slate-800/30 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Icon size={16} className="text-indigo-400" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                </div>
                <p className="font-bold text-white text-sm">{value}</p>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </DashboardShell>
  );
}
