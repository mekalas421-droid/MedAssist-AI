"use client";

import { useEffect, useState } from "react";
import { FileText, RefreshCw, Search, Download, CheckCircle, XCircle, Clock, ShieldCheck, AlertTriangle, Eye, X } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi, diagnosticsApi, apiClient } from "@/lib/apiClient";

const DOCTOR_NAV = [
  {
    title: "Clinical Portal",
    items: [
      { href: "/doctor/dashboard", label: "Dashboard", icon: ShieldCheck },
      { href: "/doctor/patients", label: "Patients", icon: FileText },
      { href: "/doctor/reports", label: "Diagnostic Reviews", icon: FileText },
      { href: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
    ]
  }
];

export default function DoctorReportsPage() {
  const { user, isLoading } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(reports.filter(r => {
      const matchSearch = r.patient_id?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q);
      const st = r.review_status || r.report_data?.provider_review?.status || "approved";
      const matchStatus = statusFilter === "all" || st === statusFilter;
      return matchSearch && matchStatus;
    }));
  }, [search, statusFilter, reports]);

  async function loadData() {
    setRefreshing(true);
    setFeedback({ type: "", msg: "" });
    try {
      const res = await adminApi.allReports();
      const reportList = res.data || [];
      setReports(reportList);
      setFiltered(reportList);
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", msg: "Failed to load clinical reports." });
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }

  const handleReviewAction = async (newStatus) => {
    if (!selectedReport) return;
    setSubmittingReview(true);
    try {
      await diagnosticsApi.reviewReport(selectedReport.id, {
        status: newStatus,
        doctor_notes: doctorNotes
      });
      setFeedback({ type: "success", msg: `Report successfully marked as ${newStatus.toUpperCase()}.` });
      setSelectedReport(null);
      setDoctorNotes("");
      await loadData();
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", msg: typeof err === 'object' ? err?.message || "Failed to submit review." : err });
    } finally {
      setSubmittingReview(false);
    }
  };

  const downloadReportPDF = async (report) => {
    try {
      const response = await apiClient.get(`/api/v1/diagnostics/report/${report.submission_id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `medassist_clinical_report_${report.submission_id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Download PDF error:", err);
    }
  };

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Health Reports..." /></div>;

  const pendingCount = reports.filter(r => (r.review_status || r.report_data?.provider_review?.status) === "pending").length;
  const approvedCount = reports.filter(r => (r.review_status || r.report_data?.provider_review?.status || "approved") === "approved").length;

  return (
    <DashboardShell navItems={DOCTOR_NAV} role="doctor">
      <div className="space-y-6">
        <PageHeader
          title="Clinical Decision Support — Doctor Review"
          subtitle="Inspect AI disease predictions, evaluate risk factors, and issue clinical approvals."
          breadcrumbs={[{ label: "Dashboard", href: "/doctor/dashboard" }, { label: "Diagnostic Reviews" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {feedback.msg && (
          <div className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedback.type === "error" ? "bg-red-950/40 border-red-800 text-red-300" : "bg-emerald-950/40 border-emerald-800 text-emerald-300"
          }`}>
            {feedback.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            {feedback.msg}
          </div>
        )}

        {/* Summary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Reports", value: reports.length, color: "from-blue-600 to-cyan-500" },
            { label: "Pending Review", value: pendingCount, color: "from-amber-500 to-orange-500" },
            { label: "Approved Reports", value: approvedCount, color: "from-emerald-600 to-teal-500" },
            { label: "This Month", value: reports.filter(r => new Date(r.generated_at) >= new Date(new Date().setDate(1))).length, color: "from-violet-600 to-purple-500" },
          ].map(({ label, value, color }, i) => (
            <PremiumCard key={label} delay={i * 0.06} className="p-5">
              <div className={`text-2xl font-extrabold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </PremiumCard>
          ))}
        </div>

        {/* Search & Filter bar */}
        <PremiumCard className="p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search report ID or patient ID..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {["all", "pending", "approved", "rejected"].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                  statusFilter === st
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800/40 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </PremiumCard>

        {/* Table */}
        <PremiumCard className="p-6 overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={FileText} title="No Clinical Reports Found" description={search ? "No results match your search." : "No reports logged yet."} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-4">Report ID</th>
                    <th className="p-4">Patient ID</th>
                    <th className="p-4">Review Status</th>
                    <th className="p-4">Generated Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-800/20">
                  {filtered.map((r, i) => {
                    const st = r.review_status || r.report_data?.provider_review?.status || "approved";
                    return (
                      <tr key={r.id || i} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-slate-300 text-xs">{(r.id || "").substring(0, 13)}...</td>
                        <td className="p-4 font-mono text-slate-400 text-xs">{(r.patient_id || "").substring(0, 13)}...</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                            st === "rejected" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            st === "pending" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {st === "approved" && <CheckCircle size={12} />}
                            {st === "rejected" && <XCircle size={12} />}
                            {st === "pending" && <Clock size={12} />}
                            {st}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-xs">
                          {r.generated_at ? new Date(r.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedReport(r); setDoctorNotes(r.doctor_notes || r.report_data?.provider_review?.doctor_notes || ""); }}
                            className="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                          >
                            <Eye size={14} /> Review
                          </button>
                          <button
                            onClick={() => downloadReportPDF(r)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PremiumCard>
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 text-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-fadeUp shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="text-indigo-400" /> Physician Decision Review — #{selectedReport.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-400">Patient ID: {selectedReport.patient_id}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            {/* AI Predictions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">AI Differential Predictions</h4>
              <div className="space-y-2">
                {selectedReport.report_data?.predictions?.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-sm">
                    <span className="font-semibold text-white">{p.disease_name}</span>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-1 rounded">
                      {Math.round(p.probability * 100)}% Probability
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Assessed Risk Level</span>
                <span className="text-sm font-extrabold text-white uppercase">{selectedReport.report_data?.risk_assessment?.risk_category || "Low"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Composite Risk Score</span>
                <span className="text-sm font-mono font-extrabold text-amber-400">{selectedReport.report_data?.risk_assessment?.risk_score || 0} / 100</span>
              </div>
            </div>

            {/* Doctor Notes Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Physician Clinical Notes & Diagnostic Adjustments
              </label>
              <textarea
                rows={4}
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                placeholder="Enter clinical notes, treatment recommendations, or patient guidance..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => handleReviewAction("rejected")}
                disabled={submittingReview}
                className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <XCircle size={15} /> Reject Report
              </button>
              <button
                onClick={() => handleReviewAction("approved")}
                disabled={submittingReview}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle size={15} /> Approve Report
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
