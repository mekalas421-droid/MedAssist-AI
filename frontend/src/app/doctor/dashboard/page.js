"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, Calendar, FileText, ClipboardList,
  Pill, NotebookPen, BarChart3, User, LogOut,
  Stethoscope, AlertTriangle, CheckCircle, Clock, Activity,
  Search, Video, ShieldPlus
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import HeartbeatLine from "@/components/ui/HeartbeatLine";
import { useAuthStore } from "@/lib/authStore";
import { apiClient } from "@/lib/apiClient";

const NAV = [
  {
    label: "Overview",
    items: [
      { href: "/doctor/dashboard",     label: "Dashboard",           icon: LayoutDashboard },
      { href: "/doctor/patients",      label: "Today's Patients",    icon: Users },
      { href: "/doctor/queue",         label: "Patient Queue",       icon: Clock },
    ],
  },
  {
    label: "Clinical",
    items: [
      { href: "/doctor/appointments",  label: "Appointments",        icon: Calendar },
      { href: "/doctor/reports",       label: "Patient Reports",     icon: FileText },
      { href: "/doctor/history",       label: "Patient History",     icon: ClipboardList },
      { href: "/doctor/prescriptions", label: "Prescriptions",       icon: Pill },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/doctor/analytics",     label: "Analytics",           icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/doctor/profile",       label: "Profile",             icon: User },
      { href: "#",                     label: "Logout",              icon: LogOut },
    ],
  },
];

export default function DoctorDashboardPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medNotes, setMedNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [user, isLoading]);

  async function loadData() {
    try {
      const { data } = await apiClient.get("/api/v1/appointments/me");
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }

  async function handleSaveNotes() {
    if (!selectedPatient || !medNotes.trim()) return;
    setSaving(true);
    try {
      await apiClient.post(`/api/v1/patients/${selectedPatient.patient_id}/history`, {
        condition_name: "Clinical Assessment",
        notes: `Prescription: ${prescription}. Observations: ${medNotes}`,
      });
      setSaveMsg("Clinical record saved successfully");
      setTimeout(() => setSaveMsg(""), 3000);
      setMedNotes("");
      setPrescription("");
      // Update local state to mark completed
      setAppointments(prev => prev.map(a => a.id === selectedPatient.id ? {...a, status: "completed"} : a));
      setSelectedPatient(null);
    } catch (err) {
      console.error(err);
      setSaveMsg("Error saving record");
      setTimeout(() => setSaveMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Doctor Workspace..." /></div>;
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPatients = appointments.filter(a => new Date(a.appointment_date) >= today);
  const pending = appointments.filter(a => a.status === "scheduled");
  const emergencies = appointments.filter(a => a.notes?.toLowerCase().includes("emergency") || a.status === "emergency");

  const filteredQueue = todayPatients.filter(a =>
    !search || a.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = [
    { status: "Scheduled", count: pending.length || 0 },
    { status: "Completed", count: appointments.filter(a => a.status === "completed").length || 0 },
    { status: "Cancelled", count: appointments.filter(a => a.status === "cancelled").length || 0 },
    { status: "Emergency", count: emergencies.length || 0 },
  ];

  const navWithLogout = NAV.map(section => ({
    ...section,
    items: section.items.map(item => item.label === "Logout" ? { ...item, href: "#", onClick: logout } : item),
  }));

  return (
    <DashboardShell navItems={navWithLogout} role="doctor">
      <div className="space-y-6">

        <PageHeader 
          title={`Welcome back, Dr. ${user.full_name?.split(" ").slice(-1)[0]} 👋`}
          subtitle="Your clinical workspace and patient queue for today."
        />

        {/* ── WELCOME HERO (PREMIUM) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden p-8 lg:p-10 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)" }}
        >
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #34d399, transparent)" }} />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Doctor Portal Active</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                Streamline Your <br/>
                <span className="text-emerald-300">Clinical Workflow.</span>
              </h1>
              <p className="text-emerald-100/70 font-medium text-sm">
                You have {pending.length} pending reviews and {todayPatients.length} scheduled consultations today.
              </p>
            </div>

            {/* Patients Counter */}
            <div className="shrink-0 flex flex-col items-center p-6 bg-emerald-950/40 rounded-3xl backdrop-blur-md border border-emerald-500/20 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/50 mb-3">
                <Users size={32} className="text-white" />
              </div>
              <span className="text-white text-3xl font-extrabold">{todayPatients.length}</span>
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1">Today&apos;s Queue</span>
            </div>
          </div>
          
          <div className="mt-8 opacity-30">
            <HeartbeatLine color="#34d399" height={40} className="w-full" />
          </div>
        </motion.div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Today's Patients" value={todayPatients.length} color="emerald" delay={0.1} />
          <StatCard icon={FileText} label="Pending Reviews" value={pending.length} color="blue" delay={0.2} />
          <StatCard icon={AlertTriangle} label="Emergency" value={emergencies.length} color="rose" delay={0.3} />
          <StatCard icon={Calendar} label="Total Appointments" value={appointments.length} color="amber" delay={0.4} />
        </div>

        {/* ── PATIENT QUEUE + DETAIL PANEL ── */}
        <div className="grid lg:grid-cols-[1fr_2fr] gap-6">

          {/* Patient Queue List */}
          <PremiumCard className="p-6 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-white">Live Queue</h3>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
                {filteredQueue.length} Wait
              </span>
            </div>

            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {filteredQueue.length === 0 ? (
                <EmptyState icon={Users} title="Empty Queue" description="No patients are scheduled for today." />
              ) : (
                filteredQueue.map((a, i) => (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    key={a.id}
                    onClick={() => { setSelectedPatient(a); setMedNotes(""); setPrescription(""); setSaveMsg(""); }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                      selectedPatient?.id === a.id 
                        ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                        : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/60 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                          a.status === 'scheduled' ? 'bg-gradient-to-br from-blue-600 to-cyan-500' : 'bg-gradient-to-br from-slate-600 to-slate-500'
                        }`}>
                          {a.patient_name?.[0] || "P"}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{a.patient_name || "Unknown"}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${a.status === 'scheduled' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'}`} />
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </PremiumCard>

          {/* Clinical Workpad */}
          <PremiumCard className="p-6 h-[700px] flex flex-col">
            {!selectedPatient ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <ShieldPlus size={64} className="text-slate-700 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Select a Patient</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  Choose a patient from the queue to review their medical history, AI diagnostics, and record clinical notes.
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Header Info */}
                <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-900/50">
                      {selectedPatient.patient_name?.[0] || "P"}
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white">{selectedPatient.patient_name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-800/50 px-2.5 py-1 rounded-full border border-white/5">
                          ID: {String(selectedPatient.id).slice(0, 8)}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          {selectedPatient.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <AnimatedButton variant="secondary" onClick={() => setSelectedPatient(null)}>Close</AnimatedButton>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {saveMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 text-sm font-bold">
                      <CheckCircle size={18} /> {saveMsg}
                    </motion.div>
                  )}

                  {/* Pre-visit Notes */}
                  {selectedPatient.notes && (
                    <div className="p-5 rounded-2xl bg-slate-800/30 border border-white/5">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <NotebookPen size={12} /> Pre-visit Notes / Symptoms
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        {selectedPatient.notes}
                      </p>
                    </div>
                  )}

                  {/* Inputs */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block pl-1">
                      Clinical Evaluation (SOAP Notes)
                    </label>
                    <textarea
                      value={medNotes}
                      onChange={e => setMedNotes(e.target.value)}
                      placeholder="Subjective, Objective, Assessment, Plan..."
                      className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block pl-1">
                      Prescription (Rx)
                    </label>
                    <textarea
                      value={prescription}
                      onChange={e => setPrescription(e.target.value)}
                      placeholder="e.g. Amoxicillin 500mg PO TID x 7 days..."
                      className="w-full h-24 bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-sm text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none resize-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 flex justify-end">
                  <AnimatedButton onClick={handleSaveNotes} disabled={!medNotes.trim() || saving} isLoading={saving} className="!bg-emerald-600 hover:!bg-emerald-500">
                    Sign & Save Record
                  </AnimatedButton>
                </div>
              </div>
            )}
          </PremiumCard>
        </div>

        {/* ── APPOINTMENT STATISTICS CHART ── */}
        <PremiumCard className="p-6">
          <h3 className="font-bold text-lg text-white mb-6">Workload Statistics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", fontSize: 12 }}
                itemStyle={{ color: "#10b981", fontWeight: "bold" }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="url(#doctorBarGrad)" name="Patients" />
              <defs>
                <linearGradient id="doctorBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
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
