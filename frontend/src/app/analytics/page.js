"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";
import { Users, Activity, Target, Gauge, AlertTriangle, TrendingUp, ShieldCheck, CheckCircle2, Info, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/ui/StatCard";
import { analyticsApi } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";

const BRAND_BARS = ["#123464", "#1d6fa5", "#2e86c1", "#4a93d6", "#78b0e2", "#a6cced"];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading, loadCurrentUser } = useAuthStore();
  const [dist, setDist] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [symptomData, setSymptomData] = useState([]);
  const [system, setSystem] = useState(null);
  const [trends, setTrends] = useState([]);
  const [approvalStats, setApprovalStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    
    if (user && user.role === "patient") {
      router.push("/dashboard");
      return;
    }

    async function loadAnalytics() {
      setPageLoading(true);
      try {
        const [distRes, riskRes, sympRes, sysRes, trendRes, appRes, insRes] = await Promise.allSettled([
          analyticsApi.diseaseDistribution(days),
          analyticsApi.riskDistribution(days),
          analyticsApi.symptomTrends(days),
          analyticsApi.systemOverview(),
          analyticsApi.healthTrends(days),
          analyticsApi.approvalStats(days),
          analyticsApi.continuousInsights(days)
        ]);
        
        if (distRes.status === "fulfilled") {
          setDist(distRes.value.data.data.map(item => ({ name: item.disease, value: item.count })));
        }
        if (riskRes.status === "fulfilled") {
          setRiskData(riskRes.value.data.data.map(item => ({ name: item.risk_category.toUpperCase(), value: item.count })));
        }
        if (sympRes.status === "fulfilled") {
          setSymptomData(sympRes.value.data.data.map(item => ({ name: item.symptom, value: item.count })));
        }
        if (sysRes.status === "fulfilled") {
          setSystem(sysRes.value.data);
        }
        if (trendRes.status === "fulfilled") {
          setTrends(trendRes.value.data.timeline || []);
        }
        if (appRes.status === "fulfilled") {
          setApprovalStats(appRes.value.data);
        }
        if (insRes.status === "fulfilled") {
          setInsights(insRes.value.data.insights || []);
        }
      } catch (err) {
        console.error("Error loading analytics", err);
        setError("Could not load population analytics. Access may be restricted or server is offline.");
      } finally {
        setPageLoading(false);
      }
    }

    if (user) {
      loadAnalytics();
    }
  }, [user, isLoading, days, router]);

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-brand-600 font-semibold animate-pulse flex items-center gap-2">
          <TrendingUp className="animate-spin" size={20} /> Loading real database analytics & trends...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AppShell title="Population Analytics" subtitle="Aggregate trends across all patient submissions.">
        <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {typeof error === 'object' ? error?.msg || error?.message || JSON.stringify(error) : error}
        </div>
      </AppShell>
    );
  }

  const approvalPieData = [
    { name: "Approved", value: approvalStats?.approved || 0, color: "#10b981" },
    { name: "Pending", value: approvalStats?.pending || 0, color: "#f59e0b" },
    { name: "Rejected", value: approvalStats?.rejected || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <AppShell title="Population Analytics & Insights" subtitle="Real database analytics, time-series health trends, and clinical decision support insights.">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-500" /> Platform Diagnostic Telemetry
        </h2>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {[7, 30, 90, 180].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                days === d
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* High-level system stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Patients" value={system?.total_patients || 0} />
        <StatCard icon={Activity} label="Submissions" value={system?.total_symptom_submissions || 0} />
        <StatCard icon={Target} label="Predictions Made" value={system?.total_predictions_generated || 0} />
        <StatCard icon={Gauge} label="Emergency Flagged" value={system?.emergency_cases_flagged || 0} />
        <StatCard icon={ShieldCheck} label="Report Approvals" value={approvalStats?.approved || 0} />
      </div>

      {/* CONTINUOUS IMPROVEMENT INSIGHTS CARD */}
      {insights.length > 0 && (
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-cyan-400 animate-pulse" size={20} />
            <h3 className="font-bold text-lg text-white">Continuous Improvement Clinical Insights</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((ins, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded">
                  {ins.category}
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">{ins.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIME-SERIES CHARTS SECTION */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Health Trends Over Time */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Symptom Submissions & Confidence Trends</h3>
          <p className="text-xs text-slate-400 mb-4">Daily volume of triage submissions and mean AI confidence score over time</p>
          {trends.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No time-series history available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trends} margin={{ left: -15, right: 10 }}>
                <defs>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "#10b981" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="submissions" name="Submissions" stroke="#2563eb" fillOpacity={1} fill="url(#subGrad)" />
                <Line yAxisId="right" type="monotone" dataKey="avg_confidence" name="Avg Confidence %" stroke="#10b981" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk Level Trends over time */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Risk Tier Distribution Over Time</h3>
          <p className="text-xs text-slate-400 mb-4">Daily breakdown of Low, Medium, High, and Critical risk categories</p>
          {trends.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No risk trend records available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trends} margin={{ left: -15, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="low_risk" name="Low Risk" stackId="a" fill="#10b981" />
                <Bar dataKey="medium_risk" name="Medium Risk" stackId="a" fill="#f59e0b" />
                <Bar dataKey="high_risk" name="High Risk" stackId="a" fill="#ef4444" />
                <Bar dataKey="critical_risk" name="Critical Risk" stackId="a" fill="#7f1d1d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Disease distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Top Predicted Diseases</h3>
          <p className="text-xs text-slate-400 mb-4">Most frequent Rank-1 condition predictions</p>
          {dist.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No predictive history available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dist} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {dist.map((_, i) => (
                    <Cell key={i} fill={BRAND_BARS[i % BRAND_BARS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk level breakdown pie */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Risk Level Share</h3>
          <p className="text-xs text-slate-400 mb-4">Percentage breakdown by risk severity</p>
          {riskData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No risk profiling records available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {riskData.map((entry, i) => {
                    const color = entry.name === "CRITICAL" ? "#7f1d1d" : (entry.name === "HIGH" ? "#ef4444" : (entry.name === "MEDIUM" ? "#f59e0b" : "#10b981"));
                    return <Cell key={i} fill={color} />;
                  })}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Clinician Approval Statistics */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Clinician Approval Stats</h3>
          <p className="text-xs text-slate-400 mb-4">Status of physician report reviews</p>
          {approvalPieData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No review decisions logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={approvalPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {approvalPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Symptom trend */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mt-6">
        <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Frequently Reported Symptoms</h3>
        <p className="text-xs text-slate-400 mb-4">Total occurrences logged by the triage engine</p>
        {symptomData.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No symptom frequency statistics available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={symptomData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </AppShell>
  );
}
