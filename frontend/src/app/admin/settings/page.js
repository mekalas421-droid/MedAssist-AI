"use client";

import { useState } from "react";
import {
  Settings, Building, Brain, Shield, Database,
  Save, CheckCircle, Globe, Clock, Bell, Lock, Server
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { ADMIN_NAV } from "../adminNav";

const SECTION_ICONS = { hospital: Building, ai: Brain, security: Shield, backup: Database };

export default function AdminSettingsPage() {
  const { user, logout } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("hospital");

  const [hospitalSettings, setHospitalSettings] = useState({
    hospital_name: "MedAssist Enterprise Network",
    address: "123 Healthcare Blvd, Medical District",
    timezone: "UTC+5:30",
    contact_email: user?.email || "admin@medassist.ai",
    support_phone: "+1 800 MED-ASST",
    logo_url: "",
  });

  const [aiSettings, setAiSettings] = useState({
    confidence_threshold: "0.75",
    max_predictions: "5",
    emergency_threshold: "0.90",
    model_version: "MedAssist-AI-v3.2",
    auto_flag_emergency: true,
    enable_risk_stratification: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    session_timeout_minutes: "60",
    max_login_attempts: "5",
    require_2fa: false,
    password_min_length: "8",
    jwt_expiry_hours: "24",
    allow_self_registration: true,
  });

  const [backupSettings, setBackupSettings] = useState({
    auto_backup: true,
    backup_frequency: "daily",
    retention_days: "30",
    backup_location: "Cloud Storage",
    last_backup: new Date(Date.now() - 3600000).toLocaleString(),
  });

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));

  const SECTIONS = [
    { id: "hospital", label: "Hospital Settings", icon: Building },
    { id: "ai", label: "AI Configuration", icon: Brain },
    { id: "security", label: "Security Settings", icon: Shield },
    { id: "backup", label: "Backup & Recovery", icon: Database },
  ];

  function FieldInput({ label, value, onChange, type = "text", disabled = false }) {
    return (
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <input type={type} value={value} onChange={onChange} disabled={disabled}
          className="w-full bg-slate-800/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed" />
      </div>
    );
  }

  function Toggle({ label, description, checked, onChange }) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/20 border border-white/5">
        <div>
          <p className="font-bold text-white text-sm">{label}</p>
          {description && <p className="text-xs text-slate-400 font-medium mt-0.5">{description}</p>}
        </div>
        <button type="button" onClick={() => onChange(!checked)}
          className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-700"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${checked ? "translate-x-6" : ""}`} />
        </button>
      </div>
    );
  }

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="System Settings"
          subtitle="Configure hospital parameters, AI behavior, security policies, and backup settings."
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Settings" }]}
        />

        {saved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-400" />
            <p className="text-emerald-300 font-bold text-sm">Settings saved successfully!</p>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-56 shrink-0">
            <PremiumCard className="p-2">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeSection === id ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/30"}`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </PremiumCard>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSave} className="space-y-6">

              {/* Hospital Settings */}
              {activeSection === "hospital" && (
                <PremiumCard className="p-6">
                  <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center"><Building size={18} className="text-blue-400" /></div>
                    Facility Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FieldInput label="Hospital / Network Name" value={hospitalSettings.hospital_name} onChange={e => setHospitalSettings(s => ({ ...s, hospital_name: e.target.value }))} />
                    <FieldInput label="Contact Email" value={hospitalSettings.contact_email} onChange={e => setHospitalSettings(s => ({ ...s, contact_email: e.target.value }))} type="email" />
                    <FieldInput label="Address" value={hospitalSettings.address} onChange={e => setHospitalSettings(s => ({ ...s, address: e.target.value }))} />
                    <FieldInput label="Support Phone" value={hospitalSettings.support_phone} onChange={e => setHospitalSettings(s => ({ ...s, support_phone: e.target.value }))} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timezone</label>
                      <select value={hospitalSettings.timezone} onChange={e => setHospitalSettings(s => ({ ...s, timezone: e.target.value }))}
                        className="w-full bg-slate-800/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50">
                        {["UTC", "UTC+5:30", "UTC+8", "UTC-5", "UTC-8", "UTC+1"].map(tz => <option key={tz}>{tz}</option>)}
                      </select>
                    </div>
                  </div>
                </PremiumCard>
              )}

              {/* AI Settings */}
              {activeSection === "ai" && (
                <PremiumCard className="p-6">
                  <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center"><Brain size={18} className="text-violet-400" /></div>
                    AI Engine Configuration
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <FieldInput label="Model Version" value={aiSettings.model_version} onChange={e => setAiSettings(s => ({ ...s, model_version: e.target.value }))} disabled />
                    <FieldInput label="Confidence Threshold (0-1)" value={aiSettings.confidence_threshold} onChange={e => setAiSettings(s => ({ ...s, confidence_threshold: e.target.value }))} />
                    <FieldInput label="Max Predictions Per Run" value={aiSettings.max_predictions} onChange={e => setAiSettings(s => ({ ...s, max_predictions: e.target.value }))} />
                    <FieldInput label="Emergency Flag Threshold (0-1)" value={aiSettings.emergency_threshold} onChange={e => setAiSettings(s => ({ ...s, emergency_threshold: e.target.value }))} />
                  </div>
                  <div className="space-y-3">
                    <Toggle label="Auto-Flag Emergency Cases" description="Automatically flag high-risk patients for immediate review" checked={aiSettings.auto_flag_emergency} onChange={v => setAiSettings(s => ({ ...s, auto_flag_emergency: v }))} />
                    <Toggle label="Enable Risk Stratification" description="Assign risk levels (LOW/MEDIUM/HIGH/CRITICAL) to all patients" checked={aiSettings.enable_risk_stratification} onChange={v => setAiSettings(s => ({ ...s, enable_risk_stratification: v }))} />
                  </div>
                </PremiumCard>
              )}

              {/* Security Settings */}
              {activeSection === "security" && (
                <PremiumCard className="p-6">
                  <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center"><Shield size={18} className="text-rose-400" /></div>
                    Security Policies
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <FieldInput label="Session Timeout (minutes)" value={securitySettings.session_timeout_minutes} onChange={e => setSecuritySettings(s => ({ ...s, session_timeout_minutes: e.target.value }))} />
                    <FieldInput label="Max Login Attempts" value={securitySettings.max_login_attempts} onChange={e => setSecuritySettings(s => ({ ...s, max_login_attempts: e.target.value }))} />
                    <FieldInput label="Min Password Length" value={securitySettings.password_min_length} onChange={e => setSecuritySettings(s => ({ ...s, password_min_length: e.target.value }))} />
                    <FieldInput label="JWT Token Expiry (hours)" value={securitySettings.jwt_expiry_hours} onChange={e => setSecuritySettings(s => ({ ...s, jwt_expiry_hours: e.target.value }))} />
                  </div>
                  <div className="space-y-3">
                    <Toggle label="Require Two-Factor Authentication" description="Enforce 2FA for all admin accounts" checked={securitySettings.require_2fa} onChange={v => setSecuritySettings(s => ({ ...s, require_2fa: v }))} />
                    <Toggle label="Allow Self-Registration" description="Allow new users to register without admin approval" checked={securitySettings.allow_self_registration} onChange={v => setSecuritySettings(s => ({ ...s, allow_self_registration: v }))} />
                  </div>
                </PremiumCard>
              )}

              {/* Backup Settings */}
              {activeSection === "backup" && (
                <PremiumCard className="p-6">
                  <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Database size={18} className="text-emerald-400" /></div>
                    Backup & Recovery
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Backup Frequency</label>
                      <select value={backupSettings.backup_frequency} onChange={e => setBackupSettings(s => ({ ...s, backup_frequency: e.target.value }))}
                        className="w-full bg-slate-800/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50">
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <FieldInput label="Retention Period (days)" value={backupSettings.retention_days} onChange={e => setBackupSettings(s => ({ ...s, retention_days: e.target.value }))} />
                    <FieldInput label="Backup Location" value={backupSettings.backup_location} onChange={e => setBackupSettings(s => ({ ...s, backup_location: e.target.value }))} />
                    <FieldInput label="Last Backup" value={backupSettings.last_backup} onChange={() => {}} disabled />
                  </div>
                  <Toggle label="Automatic Backups" description="Run backups automatically on the configured schedule" checked={backupSettings.auto_backup} onChange={v => setBackupSettings(s => ({ ...s, auto_backup: v }))} />
                </PremiumCard>
              )}

              <div className="flex justify-end">
                <AnimatedButton type="submit" icon={Save}>Save Settings</AnimatedButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
