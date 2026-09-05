"use client";

import { useEffect, useState } from "react";
import { 
  ClipboardList, Stethoscope, FileText, Pill, AlertCircle, Calendar, Plus, Download, Clock 
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { patientApi, diagnosticsApi } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";

const NAV = [
  {
    label: "Main",
    items: [
      { href: "/patient/dashboard", label: "Dashboard", icon: ClipboardList },
      { href: "/patient/history",   label: "Medical History", icon: Clock },
    ],
  }
];

export default function MedicalHistoryPage() {
  const { user, isLoading } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      loadHistory();
    }
  }, [user, isLoading]);

  async function loadHistory() {
    try {
      // Mocked mixed history since backend might only have reports right now
      const repRes = await diagnosticsApi.myReports();
      const reports = repRes.data || [];
      
      const formattedHistory = reports.map(r => ({
        id: r.id,
        date: r.generated_at,
        type: "report",
        title: "AI Diagnostic Report",
        description: r.report_data?.predictions?.[0]?.disease_name 
          ? `Predicted: ${r.report_data.predictions[0].disease_name} (${Math.round(r.report_data.predictions[0].probability * 100)}% match)`
          : "General Health Analysis",
        icon: FileText,
        color: "bg-blue-500",
      }));

      // Add some mock events to show the timeline UI capabilities
      formattedHistory.push({
        id: "mock-1",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        type: "visit",
        title: "Cardiology Consultation",
        description: "Dr. Sarah Jenkins - General checkup and ECG.",
        icon: Stethoscope,
        color: "bg-purple-500",
      });
      formattedHistory.push({
        id: "mock-2",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        type: "medication",
        title: "Prescription Updated",
        description: "Lisinopril 10mg added for blood pressure management.",
        icon: Pill,
        color: "bg-emerald-500",
      });

      // Sort by date descending
      formattedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(formattedHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Medical History..." /></div>;

  return (
    <DashboardShell navItems={NAV} role="patient">
      <PageHeader 
        title="Medical History" 
        subtitle="Timeline of your hospital visits, reports, and treatments."
        breadcrumbs={[{ label: "Dashboard", href: "/patient/dashboard" }, { label: "Medical History" }]}
        actions={
          <AnimatedButton icon={Download} variant="secondary">
            Export Records
          </AnimatedButton>
        }
      />

      <div className="max-w-4xl mx-auto">
        {history.length === 0 ? (
          <EmptyState 
            icon={ClipboardList} 
            title="No medical history" 
            description="You don't have any recorded medical history yet." 
          />
        ) : (
          <div className="relative border-l-2 border-slate-700/50 ml-4 md:ml-6 space-y-8 pb-12">
            {history.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-8 md:pl-12"
              >
                {/* Timeline Node */}
                <div className={`absolute top-0 left-[-17px] w-8 h-8 rounded-full border-4 border-slate-900 ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon size={12} className="text-white" />
                </div>
                
                {/* Content Card */}
                <PremiumCard className="p-5 hover:border-blue-500/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <h4 className="text-lg font-bold text-white">{item.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full w-fit">
                      <Calendar size={12} />
                      {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">
                    {item.description}
                  </p>
                  
                  {item.type === "report" && (
                    <div className="mt-4 flex gap-3">
                      <button className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
                        View Details
                      </button>
                    </div>
                  )}
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
