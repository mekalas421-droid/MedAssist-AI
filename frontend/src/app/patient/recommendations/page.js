"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Apple, Activity, Heart, Moon, Shield, Download, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { diagnosticsApi } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";

const NAV = [
  {
    label: "Main",
    items: [
      { href: "/patient/dashboard", label: "Dashboard", icon: Activity },
      { href: "/patient/recommendations", label: "Recommendations", icon: Lightbulb },
    ],
  }
];

export default function RecommendationsPage() {
  const { user, isLoading } = useAuthStore();
  const [recommendations, setRecommendations] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      loadRecommendations();
    }
  }, [user, isLoading]);

  async function loadRecommendations() {
    try {
      // Mocked mixed recommendations based on latest report
      const repRes = await diagnosticsApi.myReports();
      const reports = repRes.data || [];
      
      let recs = [];
      if (reports.length > 0 && reports[0].report_data?.recommendations) {
        // Map backend recommendations
        recs = reports[0].report_data.recommendations.map((r, i) => ({
          id: `rec-${i}`,
          category: r.type || "General",
          title: "Medical Advice",
          description: r.content,
          icon: Shield,
          color: "from-blue-600 to-cyan-500",
        }));
      }

      // Add general lifestyle ones for premium feel
      recs.push({
        id: "life-1",
        category: "Diet & Nutrition",
        title: "Heart-Healthy Diet",
        description: "Incorporate more leafy greens and omega-3 rich foods to maintain your cardiovascular health.",
        icon: Apple,
        color: "from-emerald-500 to-teal-400",
      });
      recs.push({
        id: "life-2",
        category: "Activity",
        title: "Daily Steps Goal",
        description: "Aim for at least 8,000 steps per day to improve circulation and baseline endurance.",
        icon: Activity,
        color: "from-violet-600 to-purple-500",
      });
      recs.push({
        id: "life-3",
        category: "Recovery",
        title: "Sleep Optimization",
        description: "Maintain a consistent sleep schedule of 7-8 hours to allow cellular repair.",
        icon: Moon,
        color: "from-slate-600 to-slate-400",
      });

      setRecommendations(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Generating Recommendations..." /></div>;

  return (
    <DashboardShell navItems={NAV} role="patient">
      <PageHeader 
        title="Personalized Recommendations" 
        subtitle="AI-driven lifestyle and medical advice based on your recent health data."
        breadcrumbs={[{ label: "Dashboard", href: "/patient/dashboard" }, { label: "Recommendations" }]}
        actions={
          <AnimatedButton icon={Download} variant="secondary">
            Download Plan
          </AnimatedButton>
        }
      />

      <div className="max-w-7xl mx-auto">
        {recommendations.length === 0 ? (
          <EmptyState 
            icon={Lightbulb} 
            title="No recommendations" 
            description="Run a symptom check or generate a health report to receive AI recommendations." 
          />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.map((rec, idx) => (
              <motion.div 
                key={rec.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="h-full"
              >
                <PremiumCard className="p-6 h-full flex flex-col group overflow-hidden relative">
                  
                  {/* Decorative background blob */}
                  <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${rec.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />

                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rec.color} flex items-center justify-center shadow-lg relative z-10`}>
                      <rec.icon size={24} className="text-white" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{rec.category}</p>
                      <h3 className="text-lg font-bold text-white leading-tight">{rec.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-300 font-medium leading-relaxed flex-1 relative z-10">
                    {rec.description}
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                    <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors">
                      <CheckCircle2 size={16} /> Mark as Done
                    </button>
                    <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                      Read More
                    </button>
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
