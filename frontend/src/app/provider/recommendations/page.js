"use client";

import { useEffect, useState } from "react";
import { Lightbulb, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
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

const RECS = [
  {
    priority: "HIGH",
    category: "Infection Control",
    title: "Elevated Respiratory Illness Cases",
    recommendation: "Consider implementing enhanced respiratory hygiene protocols and ensuring adequate PPE stock.",
    action: "Review triage data and flag respiratory cases for close monitoring.",
    color: "border-red-500/30 bg-red-500/5",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: AlertTriangle,
    iconColor: "text-red-400",
  },
  {
    priority: "MEDIUM",
    category: "Chronic Disease Management",
    title: "Diabetes & Cardiovascular Risk Clustering",
    recommendation: "Launch targeted outreach for high-risk metabolic patients. Recommend HbA1c and lipid panel monitoring.",
    action: "Coordinate with clinical staff to schedule preventive screenings.",
    color: "border-amber-500/30 bg-amber-500/5",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: Lightbulb,
    iconColor: "text-amber-400",
  },
  {
    priority: "LOW",
    category: "Operational Efficiency",
    title: "Triage Backlog Optimization",
    recommendation: "AI submission patterns indicate peak load hours. Consider redistributing clinical review capacity.",
    action: "Adjust staffing schedules to align with AI-identified peak triage windows.",
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: CheckCircle,
    iconColor: "text-blue-400",
  },
  {
    priority: "LOW",
    category: "Preventive Care",
    title: "Seasonal Immunization Drive",
    recommendation: "Based on symptom trend analysis, a seasonal immunization campaign is recommended for highest-risk cohorts.",
    action: "Prepare facility-wide immunization scheduling for coming quarter.",
    color: "border-emerald-500/30 bg-emerald-500/5",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: Sparkles,
    iconColor: "text-emerald-400",
  },
];

export default function RecommendationsPage() {
  const { user, isLoading } = useAuthStore();
  const [system, setSystem] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);

  async function loadData() {
    try {
      const res = await analyticsApi.systemOverview();
      setSystem(res.data);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Recommendations..." /></div>;

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Clinical Recommendations"
          subtitle="AI-generated facility-level insights and action items."
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Recommendations" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData}><RefreshCw size={15} /> Refresh</AnimatedButton>}
        />

        {/* Summary banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden p-8 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)" }}>
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-emerald-300" />
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">AI-Powered Insights</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2">
                {RECS.filter(r => r.priority === "HIGH").length} High-Priority Action{RECS.filter(r => r.priority === "HIGH").length !== 1 ? "s" : ""} Detected
              </h2>
              <p className="text-emerald-200 text-sm font-medium">
                Based on {system?.total_symptom_submissions ?? 0} triage submissions and AI prediction analysis.
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              {[
                { label: "High", value: RECS.filter(r => r.priority === "HIGH").length, color: "text-red-300" },
                { label: "Medium", value: RECS.filter(r => r.priority === "MEDIUM").length, color: "text-amber-300" },
                { label: "Low", value: RECS.filter(r => r.priority === "LOW").length, color: "text-emerald-300" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recommendation Cards */}
        <div className="space-y-4">
          {RECS.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <PremiumCard key={rec.title} delay={i * 0.1} className={`p-6 border ${rec.color}`}>
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center shrink-0 mt-1">
                    <Icon size={22} className={rec.iconColor} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${rec.badge}`}>{rec.priority}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{rec.category}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white mb-2">{rec.title}</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-4">{rec.recommendation}</p>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-800/30 border border-white/5">
                      <ArrowRight size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-slate-300">{rec.action}</p>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
