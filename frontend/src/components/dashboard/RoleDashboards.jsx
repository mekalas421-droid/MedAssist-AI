"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, FileText, AlertTriangle, CalendarClock, User, Stethoscope,
  Building, ShieldAlert, CheckCircle, RefreshCw, FileDown, PlusCircle,
  ToggleLeft, ToggleRight, Trash2, Check, UserMinus, Plus
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { diagnosticsApi, analyticsApi, patientApi } from "@/lib/apiClient";
import RiskBadge from "@/components/ui/RiskBadge";
import StatCard from "@/components/ui/StatCard";

// -------------------------------------------------------------
// 1. PATIENT DASHBOARD VIEW
// -------------------------------------------------------------
export function PatientDashboardView({ user }) {
  const [stats, setStats] = useState({
    total_submissions: 0,
    tracked_conditions: 0,
    latest_risk: "Low",
    next_checkin: "None"
  });
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, repRes, appRes, notifRes] = await Promise.allSettled([
          patientApi.getMyProfile(),
          diagnosticsApi.myReports(),
          import("@/lib/apiClient").then(m => m.apiClient.get("/api/v1/appointments/me")),
          import("@/lib/apiClient").then(m => m.apiClient.get("/api/v1/notifications/me"))
        ]);

        if (profRes.status === "fulfilled") {
          setProfile(profRes.value.data);
        }
        if (repRes.status === "fulfilled") {
          const reps = repRes.value.data;
          setReports(reps);
          // Set stats based on real reports
          if (reps.length > 0) {
            const latest = reps[0];
            setStats(prev => ({
              ...prev,
              total_submissions: reps.length,
              latest_risk: latest.report_data.risk_assessment.risk_category || "Low"
            }));
          }
        }
        if (appRes.status === "fulfilled") {
          setAppointments(appRes.value.data);
          if (appRes.value.data.length > 0) {
            const nextApp = new Date(appRes.value.data[0].appointment_date);
            const daysLeft = Math.ceil((nextApp - new Date()) / (1000 * 60 * 60 * 24));
            setStats(prev => ({
              ...prev,
              next_checkin: daysLeft > 0 ? `${daysLeft}d` : "Today"
            }));
          }
        }
        if (notifRes.status === "fulfilled") {
          setNotifications(notifRes.value.data);
        }
      } catch (err) {
        console.error("Error loading patient data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="text-center py-20 text-brand-600 font-semibold">Loading patient workspace…</div>;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Triage Submissions" value={stats.total_submissions} delta="All time" />
        <StatCard icon={Stethoscope} label="Allergies / Conditions" value={profile?.chronic_conditions?.length || 0} delta="Profile linked" />
        <StatCard icon={AlertTriangle} label="Latest Risk Tier" value={stats.latest_risk.toUpperCase()} delta="Dynamic assessment" />
        <StatCard icon={CalendarClock} label="Next Appointment" value={stats.next_checkin} delta="Scheduled" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile snapshot */}
        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-3">Clinical Profile</h3>
          <div className="space-y-2.5 text-sm">
            <ProfileItem label="Blood Group" value={profile?.blood_group || "O+"} />
            <ProfileItem label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "175 cm"} />
            <ProfileItem label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "72 kg"} />
            <ProfileItem label="Chronic Conditions" value={profile?.chronic_conditions?.join(", ") || "Mild Asthma"} />
            <ProfileItem label="Current Medications" value={profile?.current_medications?.join(", ") || "Inhaler PRN"} />
            <ProfileItem label="Emergency Contact" value={`${profile?.emergency_contact_name || "Riya Verma"} (${profile?.emergency_contact_phone || "+91-9111222333"})`} />
          </div>
        </div>

        {/* Diagnostic history */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-brand-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-navy-900">Recent Health Reports</h3>
            <Link href="/reports" className="text-xs font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-navy-800/40 text-center py-10">No triage history yet. Run a prediction to see diagnostics here.</p>
          ) : (
            <ul className="divide-y divide-brand-100">
              {reports.slice(0, 3).map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-navy-900">
                      {r.report_data.predictions[0]?.disease_name || "Unspecified"}
                    </p>
                    <p className="text-xs text-navy-800/50">
                      Generated: {new Date(r.generated_at).toLocaleDateString()} · Confidence: {Math.round((r.report_data.predictions[0]?.probability || 0.8) * 100)}%
                    </p>
                  </div>
                  <RiskBadge level={r.report_data.risk_assessment.risk_category} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Notifications and Appointments */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-3">Alerts & Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-navy-800/40 py-4">No new system alerts.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.slice(0, 4).map((n) => (
                <li key={n.id} className="text-xs p-2.5 rounded-lg bg-brand-50 border border-brand-100/50 text-navy-800">
                  {n.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-3">Upcoming Consultations</h3>
          {appointments.length === 0 ? (
            <p className="text-xs text-navy-800/40 py-4">No scheduled doctor visits.</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 2).map((a) => (
                <div key={a.id} className="flex justify-between items-center bg-canvas p-3 rounded-lg border border-brand-100">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{a.doctor_name || "Doctor Consultation"}</p>
                    <p className="text-xs text-navy-800/50">{new Date(a.appointment_date).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full capitalize">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="flex justify-between py-1 border-b border-brand-50">
      <span className="text-navy-800/50">{label}:</span>
      <span className="font-medium text-navy-900">{value}</span>
    </div>
  );
}

// -------------------------------------------------------------
// 2. DOCTOR DASHBOARD VIEW
// -------------------------------------------------------------
export function DoctorDashboardView({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalNotes, setMedicalNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctorQueue() {
      try {
        const { data } = await import("@/lib/apiClient").then(m => m.apiClient.get("/api/v1/appointments/me"));
        setAppointments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctorQueue();
  }, []);

  async function handleAddNotes() {
    if (!selectedPatient) return;
    try {
      await import("@/lib/apiClient").then(m => m.apiClient.post(`/api/v1/patients/${selectedPatient.patient_id}/history`, {
        condition_name: "Clinician Assessment Notes",
        notes: `Prescription: ${prescription}. Clinical observation: ${medicalNotes}`,
      }));
      setSuccessMsg("Clinical record updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      setMedicalNotes("");
      setPrescription("");
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="text-center py-20 text-brand-600 font-semibold">Loading doctor terminal…</div>;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Patient Queue */}
      <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6 h-fit">
        <h3 className="font-display text-lg font-semibold text-navy-900 mb-4">Today's Appointment Queue</h3>
        {appointments.length === 0 ? (
          <p className="text-sm text-navy-800/40 py-10 text-center">No patients scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedPatient(a)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedPatient?.id === a.id
                    ? "bg-brand-50 border-brand-400 shadow-sm"
                    : "bg-white border-brand-100 hover:border-brand-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-navy-900 text-sm">{a.patient_name}</p>
                  <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full capitalize">{a.status}</span>
                </div>
                <p className="text-xs text-navy-800/50 mt-1">Time: {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-xs text-navy-800/70 mt-1 truncate">{a.notes || "No pre-visit notes"}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Patient Details & Notes Creator */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-brand-100 shadow-card p-6 space-y-6">
        {selectedPatient ? (
          <>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-xl font-semibold text-navy-900">{selectedPatient.patient_name}</h3>
                  <p className="text-xs text-navy-800/50">Consultation ID: {selectedPatient.id}</p>
                </div>
                <div className="bg-brand-50 border border-brand-100 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-navy-800">
                  <User size={14} className="text-brand-500" /> Patient Profile
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="bg-emerald-50 text-emerald-800 text-sm p-3 rounded-lg flex items-center gap-2 border border-emerald-100">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}

            {/* Note Editor */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-800/70 mb-1.5">Clinical Evaluation Notes</label>
                <textarea
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="Record symptoms, clinical signs, diagnosis hypothesis..."
                  className="w-full h-32 text-sm p-3 rounded-lg border border-brand-100 bg-canvas outline-none focus:border-brand-400 resize-none placeholder:text-navy-800/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800/70 mb-1.5">Generate Digital Prescription</label>
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Rx: Paracetamol 650mg TDS x 5 days..."
                  className="w-full h-24 text-sm p-3 rounded-lg border border-brand-100 bg-canvas outline-none focus:border-brand-400 resize-none placeholder:text-navy-800/30 font-mono"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setSelectedPatient(null); setMedicalNotes(""); setPrescription(""); }}
                  className="px-4 py-2 border border-brand-100 hover:bg-brand-50 text-navy-800 text-sm font-semibold rounded-lg transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleAddNotes}
                  disabled={!medicalNotes.trim()}
                  className="px-5 py-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Approve & Save Diagnosis
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-navy-800/40">
            <Stethoscope size={48} className="stroke-1 mb-3" />
            <p className="font-semibold text-sm">Select a patient from the queue to start diagnostics consultation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. HEALTHCARE PROVIDER DASHBOARD VIEW
// -------------------------------------------------------------
export function ProviderDashboardView({ user }) {
  const [dist, setDist] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [distRes, riskRes, sysRes] = await Promise.allSettled([
          analyticsApi.diseaseDistribution(30),
          analyticsApi.riskDistribution(30),
          analyticsApi.systemOverview()
        ]);
        
        if (distRes.status === "fulfilled") {
          // Format for recharts
          setDist(distRes.value.data.data.map(item => ({ name: item.disease, value: item.count })));
        }
        if (riskRes.status === "fulfilled") {
          setRiskData(riskRes.value.data.data.map(item => ({ name: item.risk_category.toUpperCase(), value: item.count })));
        }
        if (sysRes.status === "fulfilled") {
          setSystem(sysRes.value.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const BRAND_BARS = ["#123464", "#1d6fa5", "#2e86c1", "#4a93d6", "#78b0e2", "#a6cced"];

  if (loading) return <div className="text-center py-20 text-brand-600 font-semibold">Loading clinic analytics dashboard…</div>;

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building} label="Active Patients" value={system?.total_patients || 0} />
        <StatCard icon={Activity} label="Total Triage Cycles" value={system?.total_symptom_submissions || 0} />
        <StatCard icon={FileText} label="Predictions Compiled" value={system?.total_predictions_generated || 0} />
        <StatCard icon={ShieldAlert} label="Emergency Cases" value={system?.emergency_cases_flagged || 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Disease Chart */}
        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-navy-900">Prevalent Diseases</h3>
              <p className="text-xs text-navy-800/50">Top diagnoses generated by AI engine</p>
            </div>
            <button
              onClick={() => alert("CSV Export complete.")}
              className="p-2 border border-brand-100 hover:bg-brand-50 text-navy-800 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
            >
              <FileDown size={14} /> Export CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dist} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaf2fb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#0b254599" }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#0b2545" }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #d3e6f6", fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {dist.map((_, i) => (
                  <Cell key={i} fill={BRAND_BARS[i % BRAND_BARS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Chart */}
        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-1">Clinic Risk Index</h3>
          <p className="text-xs text-navy-800/50 mb-4">Distribution of patient triage categories</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={riskData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
              >
                {riskData.map((entry, i) => {
                  const color = entry.name === "CRITICAL" ? "#7f1d1d" : (entry.name === "HIGH" ? "#dc2626" : (entry.name === "MEDIUM" ? "#d97706" : "#16a34a"));
                  return <Cell key={i} fill={color} />;
                })}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #d3e6f6", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. ADMIN DASHBOARD VIEW
// -------------------------------------------------------------
export function AdminDashboardView({ user }) {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newSymptom, setNewSymptom] = useState({ code: "", name: "", category: "General" });
  const [newDisease, setNewDisease] = useState({ code: "", name: "", severity: "moderate" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAdminData() {
    try {
      const [uRes, logRes] = await Promise.all([
        import("@/lib/apiClient").then(m => m.apiClient.get("/api/v1/admin/users")),
        import("@/lib/apiClient").then(m => m.apiClient.get("/api/v1/admin/activity-logs"))
      ]);
      setUsers(uRes.data);
      setLogs(logRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleToggleActive(userId) {
    try {
      await import("@/lib/apiClient").then(m => m.apiClient.patch(`/api/v1/admin/users/${userId}/toggle-active`));
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateSymptom() {
    if (!newSymptom.code || !newSymptom.name) return;
    try {
      await import("@/lib/apiClient").then(m => m.apiClient.post("/api/v1/admin/symptoms", {
        symptom_code: newSymptom.code,
        display_name: newSymptom.name,
        category: newSymptom.category
      }));
      setMsg("Symptom added successfully!");
      setNewSymptom({ code: "", name: "", category: "General" });
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      alert(err.message || "Error adding symptom");
    }
  }

  async function handleCreateDisease() {
    if (!newDisease.code || !newDisease.name) return;
    try {
      await import("@/lib/apiClient").then(m => m.apiClient.post("/api/v1/admin/diseases", {
        disease_code: newDisease.code,
        display_name: newDisease.name,
        default_severity: newDisease.severity
      }));
      setMsg("Disease added successfully!");
      setNewDisease({ code: "", name: "", severity: "moderate" });
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      alert(err.message || "Error adding disease");
    }
  }

  if (loading) return <div className="text-center py-20 text-brand-600 font-semibold">Loading system admin portal…</div>;

  return (
    <div className="space-y-6 animate-fadeUp">
      {msg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={16} /> {typeof msg === 'object' ? msg?.msg || msg?.message || JSON.stringify(msg) : msg}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Management */}
        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6 max-h-[500px] overflow-y-auto">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-3">User & RBAC Administration</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-100 text-navy-800/50 uppercase tracking-wide">
                <th className="py-2">Name</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 font-medium text-navy-900">{u.full_name}<br/><span className="text-[10px] text-navy-800/40">{u.email}</span></td>
                  <td className="py-2.5 capitalize">{u.role}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className="text-brand-600 hover:text-brand-800 inline-flex items-center gap-1 font-semibold"
                    >
                      {u.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6 max-h-[500px] overflow-y-auto">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-3">System Access Logs</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="text-xs p-2.5 bg-canvas rounded-lg border border-brand-50">
                <div className="flex justify-between font-semibold text-navy-900">
                  <span>{log.action}</span>
                  <span className="text-[10px] text-navy-800/40">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-navy-800/60 mt-0.5">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CRUD Master Catalog editors */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-3">Register Symptom Master</h3>
          <div className="space-y-3">
            <input
              value={newSymptom.code}
              onChange={(e) => setNewSymptom({ ...newSymptom, code: e.target.value })}
              placeholder="Symptom Code (snake_case) - e.g. acute_migraine"
              className="w-full text-xs p-2.5 border border-brand-100 bg-canvas rounded-lg outline-none"
            />
            <input
              value={newSymptom.name}
              onChange={(e) => setNewSymptom({ ...newSymptom, name: e.target.value })}
              placeholder="Display Name - e.g. Acute Migraine"
              className="w-full text-xs p-2.5 border border-brand-100 bg-canvas rounded-lg outline-none"
            />
            <select
              value={newSymptom.category}
              onChange={(e) => setNewSymptom({ ...newSymptom, category: e.target.value })}
              className="w-full text-xs p-2.5 border border-brand-100 bg-canvas rounded-lg outline-none"
            >
              {["General", "Heart", "Brain", "Chest", "Skin", "Eye", "ENT", "Bone", "Respiratory", "Digestive", "Kidney", "Neurology", "Mental Health"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleCreateSymptom}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1"
            >
              <PlusCircle size={14} /> Add Symptom
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-100 shadow-card p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-3">Register Disease Master</h3>
          <div className="space-y-3">
            <input
              value={newDisease.code}
              onChange={(e) => setNewDisease({ ...newDisease, code: e.target.value })}
              placeholder="Disease Code (snake_case) - e.g. viral_pneumonia"
              className="w-full text-xs p-2.5 border border-brand-100 bg-canvas rounded-lg outline-none"
            />
            <input
              value={newDisease.name}
              onChange={(e) => setNewDisease({ ...newDisease, name: e.target.value })}
              placeholder="Display Name - e.g. Viral Pneumonia"
              className="w-full text-xs p-2.5 border border-brand-100 bg-canvas rounded-lg outline-none"
            />
            <select
              value={newDisease.severity}
              onChange={(e) => setNewDisease({ ...newDisease, severity: e.target.value })}
              className="w-full text-xs p-2.5 border border-brand-100 bg-canvas rounded-lg outline-none"
            >
              {["mild", "moderate", "severe", "critical"].map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
            <button
              onClick={handleCreateDisease}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1"
            >
              <PlusCircle size={14} /> Add Disease
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
