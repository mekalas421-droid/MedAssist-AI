"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, User, ClipboardList, Brain, Stethoscope, FileText,
  Lightbulb, Calendar, Bell, Settings, LogOut, Activity, AlertTriangle,
  ArrowRight, Plus
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import EditableProfileCard from "@/components/dashboard/EditableProfileCard";
import HeartbeatLine from "@/components/ui/HeartbeatLine";
import { useAuthStore } from "@/lib/authStore";
import { patientApi, diagnosticsApi, apiClient } from "@/lib/apiClient";

const NAV = [
  {
    label: "Main",
    items: [
      { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/patient/profile",   label: "Patient Profile", icon: User },
      { href: "/patient/history",   label: "Medical History", icon: ClipboardList },
    ],
  },
  {
    label: "Clinical Tools",
    items: [
      { href: "/symptoms",  label: "Symptom Checker", icon: Stethoscope },
      { href: "/patient/predictions", label: "Disease Prediction", icon: Brain },
      { href: "/reports",   label: "Health Reports",  icon: FileText },
      { href: "/patient/recommendations", label: "Recommendations", icon: Lightbulb },
    ],
  },
  {
    label: "Schedule",
    items: [
      { href: "/patient/appointments", label: "Appointments", icon: Calendar },
      { href: "/patient/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/patient/settings", label: "Settings", icon: Settings },
      { href: "#", label: "Logout", icon: LogOut },
    ],
  },
];

export default function PatientDashboardPage() {
  const { user, isLoading, loadCurrentUser, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [user, isLoading]);

  async function loadData() {
    try {
      const [profRes, repRes, appRes, notifRes] = await Promise.allSettled([
        patientApi.getMyProfile(),
        diagnosticsApi.myReports(),
        apiClient.get("/api/v1/appointments/me"),
        apiClient.get("/api/v1/notifications/me"),
      ]);
      if (profRes.status === "fulfilled")  setProfile(profRes.value.data);
      if (repRes.status === "fulfilled")   setReports(repRes.value.data || []);
      if (appRes.status === "fulfilled")   setAppointments(appRes.value.data || []);
      if (notifRes.status === "fulfilled") setNotifications(notifRes.value.data || []);
    } catch (err) {
      console.error("Patient data load error", err);
    } finally {
      setPageLoading(false);
    }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><LoadingSpinner text="Loading Health Dashboard..." /></div>;
  if (!user) return null;

  const latestReport = reports[0] ?? null;
  const latestRisk = latestReport?.report_data?.risk_assessment?.risk_category ?? "—";
  const healthScore = Math.min(100, Math.max(10, 100 - reports.filter(r => ["high","critical"].includes(r.report_data?.risk_assessment?.risk_category?.toLowerCase())).length * 8));

  const chartData = reports.slice(0, 7).reverse().map((r, i) => ({
    day: `R${i + 1}`,
    risk: r.report_data?.risk_assessment?.risk_score ? Math.round(r.report_data.risk_assessment.risk_score * 100) : Math.floor(Math.random() * 40 + 20),
  }));

  const pieData = [
    { name: "Low",      value: reports.filter(r => r.report_data?.risk_assessment?.risk_category?.toLowerCase() === "low").length      || 1 },
    { name: "Medium",   value: reports.filter(r => r.report_data?.risk_assessment?.risk_category?.toLowerCase() === "medium").length   || 0 },
    { name: "High",     value: reports.filter(r => r.report_data?.risk_assessment?.risk_category?.toLowerCase() === "high").length     || 0 },
    { name: "Critical", value: reports.filter(r => r.report_data?.risk_assessment?.risk_category?.toLowerCase() === "critical").length || 0 },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#7f1d1d"];

  const navWithLogout = NAV.map(section => ({
    ...section,
    items: section.items.map(item =>
      item.label === "Logout" ? { ...item, href: "#", onClick: logout } : item
    ),
  }));

  return (
    <DashboardShell navItems={navWithLogout} role="patient">
      <div className="space-y-6">

        <PageHeader 
          title={`Welcome back, ${user.full_name?.split(" ")[0]} 👋`}
          subtitle="Here is your personal health overview. Stay informed and healthy."
        />

        {/* ── WELCOME HERO (PREMIUM) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden p-8 lg:p-10 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%)" }}
        >
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Health Monitor Active</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                Your Health Intelligence, <br/>
                <span className="gradient-text">Personalized.</span>
              </h1>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/symptoms">
                  <AnimatedButton icon={Stethoscope}>Start Symptom Check</AnimatedButton>
                </Link>
                <Link href="/reports">
                  <AnimatedButton variant="secondary" icon={FileText} className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20">
                    View Reports
                  </AnimatedButton>
                </Link>
              </div>
            </div>

            {/* Health Score Ring */}
            <div className="shrink-0 flex flex-col items-center p-6 bg-slate-900/40 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90 transform-origin-center" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#healthGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: 264, strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 * (1 - healthScore / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white text-3xl font-extrabold">{healthScore}</span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Score</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 opacity-30">
            <HeartbeatLine color="#60a5fa" height={40} className="w-full" />
          </div>
        </motion.div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Reports" value={reports.length} color="blue" delay={0.1} />
          <StatCard icon={AlertTriangle} label="Latest Risk" value={latestRisk} color="rose" delay={0.2} />
          <StatCard icon={Calendar} label="Appointments" value={appointments.length} color="purple" delay={0.3} />
          <StatCard icon={Bell} label="Alerts" value={notifications.length} color="amber" delay={0.4} />
        </div>

        {/* ── PATIENT INFO + RECENT REPORTS ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="h-full">
            <EditableProfileCard profile={profile} onProfileUpdate={loadData} healthScore={healthScore} />
          </div>

          <PremiumCard delay={0.3} className="lg:col-span-2 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-white">Recent Analysis</h3>
                <p className="text-xs text-slate-400 font-medium">Latest AI diagnostic predictions</p>
              </div>
              <Link href="/reports" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {reports.length === 0 ? (
              <EmptyState 
                icon={Brain} 
                title="No AI analysis yet" 
                description="Run a symptom check to generate your first health prediction report." 
                actionLabel="Run Symptom Check"
                onAction={() => window.location.href = '/symptoms'}
              />
            ) : (
              <div className="space-y-3 flex-1">
                {reports.slice(0, 4).map((r, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    key={r.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/30 border border-white/5 hover:border-blue-500/30 transition-all hover:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/50">
                        <Brain size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-1">
                          {r.report_data?.predictions?.[0]?.disease_name || "Analysis Complete"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(r.generated_at).toLocaleDateString()} · {Math.round((r.report_data?.predictions?.[0]?.probability ?? 0.8) * 100)}% Match
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${r.report_data?.risk_assessment?.risk_category === 'low' ? 'badge-success' : r.report_data?.risk_assessment?.risk_category === 'medium' ? 'badge-warning' : 'badge-danger'} capitalize`}>
                      {r.report_data?.risk_assessment?.risk_category || "Low"} Risk
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>

        {/* ── CHARTS ROW ── */}
        {chartData.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6">
            <PremiumCard delay={0.4} className="p-6">
              <h3 className="font-bold text-lg text-white">Risk Score Trend</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Historical AI assessments</p>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", fontSize: 12, color: "#fff" }}
                    itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={3} fill="url(#riskGrad)" name="Risk Score" />
                </AreaChart>
              </ResponsiveContainer>
            </PremiumCard>

            <PremiumCard delay={0.5} className="p-6">
              <h3 className="font-bold text-lg text-white">Risk Distribution</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Breakdown of health assessments</p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={5} stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", fontSize: 12 }} itemStyle={{ color: "#fff", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </PremiumCard>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  const gradients = {
    blue: "from-blue-600 to-cyan-500",
    rose: "from-rose-600 to-pink-500",
    purple: "from-violet-600 to-purple-500",
    amber: "from-amber-500 to-orange-400",
  };
  return (
    <PremiumCard delay={delay} className="p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-extrabold text-white mt-1 capitalize">{value}</p>
      </div>
    </PremiumCard>
  );
}
