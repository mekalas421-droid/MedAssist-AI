"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, UserCheck, Stethoscope, Building,
  Pill, BugPlay, FileText, ScrollText, ClipboardList,
  BarChart3, Settings, LogOut,
  AlertTriangle, Target, PlusCircle, ToggleLeft, ToggleRight, RefreshCw, Activity, ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import HeartbeatLine from "@/components/ui/HeartbeatLine";
import { useAuthStore } from "@/lib/authStore";
import { apiClient, analyticsApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

export default function AdminDashboardPage() {
  const { user, isLoading, logout } = useAuthStore();

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [system, setSystem] = useState(null);
  const [dist, setDist] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  const [newSymptom, setNewSymptom] = useState({ code: "", name: "", category: "General" });
  const [newDisease, setNewDisease] = useState({ code: "", name: "", severity: "moderate" });
  const [formMsg, setFormMsg] = useState({ text: "", type: "success" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadAdminData();
    }
  }, [user, isLoading]);

  async function loadAdminData() {
    setPageLoading(true);
    try {
      const [uRes, logRes, sysRes, distRes] = await Promise.allSettled([
        apiClient.get("/api/v1/admin/users"),
        apiClient.get("/api/v1/admin/activity-logs"),
        analyticsApi.systemOverview(),
        analyticsApi.diseaseDistribution(30),
      ]);
      if (uRes.status === "fulfilled") setUsers(uRes.value.data || []);
      if (logRes.status === "fulfilled") setLogs(logRes.value.data || []);
      if (sysRes.status === "fulfilled") setSystem(sysRes.value.data);
      if (distRes.status === "fulfilled") {
        setDist(distRes.value.data.data?.map(d => ({ name: d.disease, value: d.count })) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }

  async function handleToggleActive(userId) {
    try {
      await apiClient.patch(`/api/v1/admin/users/${userId}/toggle-active`);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  }

  function showMsg(text, type = "success") {
    setFormMsg({ text, type });
    setTimeout(() => setFormMsg({ text: "", type: "success" }), 3500);
  }

  async function handleAddSymptom() {
    if (!newSymptom.code || !newSymptom.name) return;
    setSaving(true);
    try {
      await apiClient.post("/api/v1/admin/symptoms", {
        symptom_code: newSymptom.code,
        display_name: newSymptom.name,
        category: newSymptom.category,
      });
      showMsg("✅ Symptom added successfully!");
      setNewSymptom({ code: "", name: "", category: "General" });
    } catch (err) {
      showMsg("❌ " + (err.response?.data?.detail || err.message || "Error adding symptom"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDisease() {
    if (!newDisease.code || !newDisease.name) return;
    setSaving(true);
    try {
      await apiClient.post("/api/v1/admin/diseases", {
        disease_code: newDisease.code,
        display_name: newDisease.name,
        default_severity: newDisease.severity,
      });
      showMsg("✅ Disease registered successfully!");
      setNewDisease({ code: "", name: "", severity: "moderate" });
    } catch (err) {
      showMsg("❌ " + (err.response?.data?.detail || err.message || "Error adding disease"), "error");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading System Control Center..." /></div>;
  if (!user) return null;

  const patients = users.filter(u => u.role === "patient");
  const doctors = users.filter(u => u.role === "doctor");
  const providers = users.filter(u => u.role === "clinic");
  const admins = users.filter(u => u.role === "admin");
  const activeUsers = users.filter(u => u.is_active).length;

  const roleChartData = [
    { role: "Patients", count: patients.length },
    { role: "Doctors", count: doctors.length },
    { role: "Providers", count: providers.length },
    { role: "Admins", count: admins.length },
  ];
  const PIE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

  const navWithLogout = ADMIN_NAV.map(section => ({
    ...section,
    items: section.items.map(item => item.label === "Logout" ? { ...item, href: "#", onClick: logout } : item),
  }));

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">

        <PageHeader 
          title="System Control Center"
          subtitle="Manage RBAC, monitor infrastructure, and oversee the medical catalog."
          actions={
            <AnimatedButton onClick={loadAdminData} icon={RefreshCw} variant="secondary">
              Refresh System
            </AnimatedButton>
          }
        />

        {/* ── HERO (PREMIUM ADMIN) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden p-8 lg:p-10 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)" }}
        >
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" />
                <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Global Admin Active</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                Secure System <br/>
                <span className="text-indigo-400">Administration.</span>
              </h1>
            </div>

            {/* Quick System Stats */}
            <div className="shrink-0 grid grid-cols-2 gap-4">
              {[
                { label: "Total Users", value: users.length, color: "from-blue-600 to-indigo-500", icon: Users },
                { label: "Active Connections", value: activeUsers, color: "from-emerald-600 to-teal-500", icon: Activity },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="p-5 bg-slate-900/50 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl text-center min-w-[150px]">
                  <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-3`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="text-white text-2xl font-extrabold">{value}</p>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 opacity-30">
            <HeartbeatLine color="#818cf8" height={40} className="w-full" />
          </div>
        </motion.div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={Users} label="Total Users" value={users.length} color="blue" delay={0.1} />
          <StatCard icon={UserCheck} label="Patients" value={patients.length} color="indigo" delay={0.15} />
          <StatCard icon={Stethoscope} label="Doctors" value={doctors.length} color="emerald" delay={0.2} />
          <StatCard icon={Building} label="Providers" value={providers.length} color="purple" delay={0.25} />
          <StatCard icon={Target} label="AI Insights" value={system?.total_predictions_generated ?? 0} color="amber" delay={0.3} />
          <StatCard icon={AlertTriangle} label="Emergencies" value={system?.emergency_cases_flagged ?? 0} color="rose" delay={0.35} />
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid lg:grid-cols-2 gap-6">
          <PremiumCard className="p-6 h-[400px]">
            <h3 className="font-bold text-lg text-white">RBAC Distribution</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">User accounts by role</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={roleChartData} dataKey="count" nameKey="role" innerRadius={70} outerRadius={110} paddingAngle={4} stroke="none">
                  {roleChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: "bold", color: "#E2E8F0" }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", fontSize: 12 }} itemStyle={{ color: "#fff", fontWeight: "bold" }} />
              </PieChart>
            </ResponsiveContainer>
          </PremiumCard>

          <PremiumCard className="p-6 h-[400px]">
            <h3 className="font-bold text-lg text-white">System Inference Volume</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Global diagnostic requests</p>
            {dist.length === 0 ? (
              <EmptyState icon={Target} title="No Data" description="No diagnostic requests made yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dist.slice(0, 6)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#E2E8F0", fontWeight: "bold" }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} itemStyle={{ color: "#818cf8", fontWeight: "bold" }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="url(#adminBarGrad)" name="Requests" />
                  <defs>
                    <linearGradient id="adminBarGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </PremiumCard>
        </div>

        {/* ── TABBED MANAGEMENT PANEL ── */}
        <PremiumCard className="overflow-hidden p-0">
          <div className="flex border-b border-white/10 bg-slate-900/50">
            {[
              { id: "users",    label: "User Access Control", icon: ShieldCheck },
              { id: "symptoms", label: "Catalog: Symptoms",   icon: Pill },
              { id: "diseases", label: "Catalog: Diseases",   icon: BugPlay },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === id ? "border-indigo-500 text-indigo-400 bg-white/5" : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {formMsg.text && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-bold border ${formMsg.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                {formMsg.text}
              </motion.div>
            )}

            {/* USERS */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-lg">System Users ({users.length})</h3>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                      <tr>
                        <th className="p-4">Identity</th>
                        <th className="p-4">Role / RBAC</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Registration</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-slate-800/30">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg shrink-0
                                ${u.role === "patient" ? "bg-blue-600" : u.role === "doctor" ? "bg-emerald-600" : u.role === "clinic" ? "bg-purple-600" : "bg-rose-600"}`}>
                                {u.full_name?.[0] || "U"}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm truncate">{u.full_name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border
                              ${u.role === "patient" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                u.role === "doctor"  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                u.role === "clinic"  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${u.is_active ? "text-emerald-400" : "text-red-400"}`}>
                                {u.is_active ? "Active" : "Disabled"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-400">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleActive(u.id)}
                              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors border
                                ${u.is_active ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"}`}
                            >
                              {u.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              {u.is_active ? "Disable" : "Enable"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SYMPTOMS */}
            {activeTab === "symptoms" && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-white mb-1">Catalog New Symptom</h3>
                  <p className="text-sm text-slate-400">Add a recognizable symptom to the AI triage engine.</p>
                </div>
                <div className="grid gap-5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">Symptom Code (snake_case)</label>
                    <input
                      type="text" value={newSymptom.code} onChange={e => setNewSymptom({ ...newSymptom, code: e.target.value })}
                      placeholder="e.g. severe_migraine"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">Display Name</label>
                    <input
                      type="text" value={newSymptom.name} onChange={e => setNewSymptom({ ...newSymptom, name: e.target.value })}
                      placeholder="e.g. Severe Migraine"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">Anatomical Category</label>
                    <select
                      value={newSymptom.category} onChange={e => setNewSymptom({ ...newSymptom, category: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500"
                    >
                      {["General","Heart","Brain","Chest","Skin","Eye","ENT","Bone","Respiratory","Digestive","Kidney","Neurology","Mental Health"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <AnimatedButton onClick={handleAddSymptom} disabled={!newSymptom.code || !newSymptom.name || saving} isLoading={saving} className="!bg-indigo-600 hover:!bg-indigo-500 mt-2">
                    Inject into Catalog
                  </AnimatedButton>
                </div>
              </div>
            )}

            {/* DISEASES */}
            {activeTab === "diseases" && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-white mb-1">Catalog New Disease</h3>
                  <p className="text-sm text-slate-400">Map a new disease for the prediction engine output.</p>
                </div>
                <div className="grid gap-5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">Disease Code (snake_case)</label>
                    <input
                      type="text" value={newDisease.code} onChange={e => setNewDisease({ ...newDisease, code: e.target.value })}
                      placeholder="e.g. viral_pneumonia"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">Display Name</label>
                    <input
                      type="text" value={newDisease.name} onChange={e => setNewDisease({ ...newDisease, name: e.target.value })}
                      placeholder="e.g. Viral Pneumonia"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">Default Severity</label>
                    <select
                      value={newDisease.severity} onChange={e => setNewDisease({ ...newDisease, severity: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500"
                    >
                      {["mild","moderate","severe","critical"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <AnimatedButton onClick={handleAddDisease} disabled={!newDisease.code || !newDisease.name || saving} isLoading={saving} className="!bg-indigo-600 hover:!bg-indigo-500 mt-2">
                    Inject into Catalog
                  </AnimatedButton>
                </div>
              </div>
            )}
          </div>
        </PremiumCard>

        {/* ── ACTIVITY LOGS ── */}
        <PremiumCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-white">Security Audit Trail</h3>
              <p className="text-xs text-slate-400 font-medium">Real-time system activity logs</p>
            </div>
            <AnimatedButton variant="secondary" onClick={loadAdminData} icon={RefreshCw}>Refresh Logs</AnimatedButton>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {logs.length === 0 ? (
              <EmptyState icon={ScrollText} title="Clean Slate" description="No activity logs found for this timeframe." />
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/60 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-lg mt-1">
                    <Activity size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-white text-sm">{log.action}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString()}</p>
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-400 font-mono leading-relaxed">{log.details}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </PremiumCard>

      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  const gradients = {
    emerald: "from-emerald-600 to-teal-500",
    blue: "from-blue-600 to-cyan-500",
    indigo: "from-indigo-600 to-blue-500",
    rose: "from-rose-600 to-pink-500",
    amber: "from-amber-500 to-orange-400",
    purple: "from-violet-600 to-purple-500",
  };
  return (
    <PremiumCard delay={delay} className="p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
        <p className="text-xl font-extrabold text-white mt-1 capitalize">{value}</p>
      </div>
    </PremiumCard>
  );
}
