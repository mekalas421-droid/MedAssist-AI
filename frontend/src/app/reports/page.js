"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, FileText, Download, AlertCircle, RefreshCw, ClipboardList, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import RiskBadge2 from "@/components/ui/RiskBadge2";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { diagnosticsApi, apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";

const FILTERS = ["all", "low", "medium", "high", "critical"];

export default function ReportsPage() {
  const { user, isLoading: authLoading, loadCurrentUser } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await diagnosticsApi.myReports();
      setReports(data || []);
      if (data && data.length > 0) {
        setOpenId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve your medical reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchReports();
    }
  }, [user, authLoading]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const risk = r.report_data?.risk_assessment?.risk_category?.toLowerCase() || "low";
      return filter === "all" || risk === filter;
    });
  }, [reports, filter]);

  if (authLoading || (loading && reports.length === 0)) {
    return <LoadingScreen message="Loading your diagnostic records…" />;
  }

  // Helper to trigger PDF download of a specific report
  const downloadReportPDF = async (report) => {
    try {
      const response = await apiClient.get(`/api/v1/diagnostics/report/${report.submission_id}/pdf`, {
        responseType: 'blob' // Important for handling binary file data
      });
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `medassist_report_${report.submission_id}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError("Failed to download the PDF report. Please try again.");
    }
  };

  return (
    <AppShell title="Health Reports" subtitle="A complete history of your symptom submissions and AI-assisted predictions.">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                id={`btn-filter-${f}`}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                  filter === f
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            id="btn-refresh-reports"
            type="button"
            onClick={fetchReports}
            className="btn-secondary text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh List
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            {typeof error === 'object' ? error?.msg || error?.message || JSON.stringify(error) : error}
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-3.5">
          {filtered.map((r) => {
            const open = openId === r.id;
            const data = r.report_data;
            const primaryPrediction = data?.predictions?.[0];
            const riskCategory = data?.risk_assessment?.risk_category || "low";
            const confidence = primaryPrediction?.probability ? Math.round(primaryPrediction.probability * 100) : 80;
            const symptoms = data?.symptoms || [];

            return (
              <div
                key={r.id}
                className="premium-card rounded-2xl overflow-hidden transition-all duration-200 border"
                style={{ borderColor: "var(--border-color)" }}
              >
                {/* Accordion Trigger */}
                <button
                  type="button"
                  id={`report-acc-${r.id.slice(0, 8)}`}
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/10">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base truncate">
                        {primaryPrediction?.disease_name || "Diagnostic Analysis Report"}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(r.generated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <RiskBadge2 level={riskCategory} className="hidden sm:inline-flex" />
                    <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      {confidence}% Match
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {/* Accordion Content */}
                {open && (
                  <div className="px-5 pb-6 border-t border-slate-100 dark:border-slate-800/80 pt-5 animate-fadeUp bg-slate-50/20 dark:bg-slate-900/10 space-y-5">
                    {/* Symptoms Section */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
                        <ClipboardList size={12} /> Reported Symptoms
                      </h4>
                      {symptoms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {symptoms.map((s, i) => (
                            <span
                              key={i}
                              className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 text-xs font-semibold rounded-xl px-3 py-1.5"
                            >
                              {typeof s === 'string' ? s : s.symptom_name || "Unknown Symptom"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No direct symptoms listed in submission.</p>
                      )}
                    </div>

                    {/* Predictions Breakdown */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
                        <ShieldCheck size={12} /> Disease Prediction Breakdown
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {data?.predictions?.map((pred, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60"
                          >
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {pred.disease_name}
                            </span>
                            <span className="text-xs font-mono font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg">
                              {Math.round(pred.probability * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Provider Review Section */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-900/80 dark:to-slate-800/80 border border-blue-100/60 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-blue-500" /> Provider Review Status
                        </h4>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          (r.review_status || data?.provider_review?.status) === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            : (r.review_status || data?.provider_review?.status) === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                        }`}>
                          {(r.review_status || data?.provider_review?.status || "approved") === "approved" ? "Approved by Doctor" : (r.review_status || data?.provider_review?.status || "approved")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>Reviewer:</strong> {data?.provider_review?.reviewed_by || "Attending Physician / System Triage"}
                      </p>
                      {(r.doctor_notes || data?.provider_review?.doctor_notes) && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Doctor's Clinical Notes:</span> {r.doctor_notes || data?.provider_review?.doctor_notes}
                        </div>
                      )}
                    </div>

                    {/* Recommendations Section */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
                        <HelpCircle size={12} /> AI Guidance & Recommendations
                      </h4>
                      <div className="space-y-2">
                        {data?.recommendations?.map((rec, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                          >
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md mr-2">
                              {rec.type?.replace("_", " ")}
                            </span>
                            {rec.content}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Export Actions */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        id={`btn-download-pdf-${r.id.slice(0, 8)}`}
                        onClick={() => downloadReportPDF(r)}
                        className="btn-primary text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                      >
                        <Download size={14} /> Download Clinical Report (PDF)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-16 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">No medical reports found matching this criteria.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
