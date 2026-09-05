"use client";

import { useState } from "react";
import { Settings, Building, Globe, Phone, Mail, Lock, Save, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { PROVIDER_NAV } from "../providerNav";

export default function ProviderSettingsPage() {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    facility_name: user?.full_name || "",
    region: "Multi-City",
    current_password: "",
    new_password: "",
  });

  function update(f, v) { setForm(p => ({ ...p, [f]: v })); }

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Facility Settings"
          subtitle="Manage your healthcare provider account and facility details."
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Settings" }]}
        />

        {saved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-400" />
            <p className="text-emerald-300 font-bold text-sm">Settings saved successfully!</p>
          </motion.div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Facility info */}
          <PremiumCard className="p-6">
            <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Building size={18} className="text-indigo-400" />
              </div>
              Facility Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Facility / Organization Name", field: "facility_name", icon: Building },
                { label: "Service Region", field: "region", icon: Globe },
                { label: "Contact Phone", field: "phone_number", icon: Phone },
                { label: "Contact Email", field: "email", icon: Mail, type: "email" },
              ].map(({ label, field, icon: Icon, type = "text" }) => (
                <div key={field} className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={type} value={form[field]} onChange={e => update(field, e.target.value)}
                      className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 font-medium" />
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>

          {/* Account info */}
          <PremiumCard className="p-6">
            <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Settings size={18} className="text-blue-400" />
              </div>
              Account Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input value={form.full_name} onChange={e => update("full_name", e.target.value)}
                  className="w-full bg-slate-800/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
                <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-white/5 text-sm font-bold text-indigo-400 capitalize">
                  Healthcare Provider
                </div>
              </div>
            </div>
          </PremiumCard>

          {/* Change password */}
          <PremiumCard className="p-6">
            <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Lock size={18} className="text-rose-400" />
              </div>
              Security
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Current Password", field: "current_password" },
                { label: "New Password", field: "new_password" },
              ].map(({ label, field }) => (
                <div key={field} className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="password" value={form[field]} onChange={e => update(field, e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 font-medium" />
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>

          <div className="flex justify-end">
            <AnimatedButton type="submit" icon={Save}>Save Settings</AnimatedButton>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
