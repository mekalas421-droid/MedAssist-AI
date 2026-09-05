"use client";

import { useEffect, useState } from "react";
import { User, Activity, Settings, Shield, Key } from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { patientApi } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";
import EditableProfileCard from "@/components/dashboard/EditableProfileCard";

const NAV = [
  {
    label: "Main",
    items: [
      { href: "/patient/dashboard", label: "Dashboard", icon: Activity },
      { href: "/patient/profile", label: "Patient Profile", icon: User },
    ],
  }
];

export default function ProfilePage() {
  const { user, isLoading } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      loadProfile();
    }
  }, [user, isLoading]);

  async function loadProfile() {
    try {
      const res = await patientApi.getMyProfile();
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Profile..." /></div>;

  return (
    <DashboardShell navItems={NAV} role="patient">
      <PageHeader 
        title="Account Profile" 
        subtitle="Manage your personal information, clinical details, and security settings."
        breadcrumbs={[{ label: "Dashboard", href: "/patient/dashboard" }, { label: "Profile" }]}
      />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* Left Column: Full Profile Card */}
        <div className="space-y-6">
          <EditableProfileCard profile={profile} onProfileUpdate={loadProfile} healthScore={85} />
        </div>

        {/* Right Column: Settings & Security */}
        <div className="space-y-6">
          <PremiumCard className="p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <Settings size={18} className="text-blue-400" /> Account Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-white/5">
                <div>
                  <p className="font-bold text-sm text-white">Email Notifications</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Receive updates on reports</p>
                </div>
                <div className="w-10 h-6 bg-blue-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-white/5">
                <div>
                  <p className="font-bold text-sm text-white">SMS Alerts</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Appointment reminders</p>
                </div>
                <div className="w-10 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-slate-400 rounded-full absolute left-1 top-1 shadow-sm" />
                </div>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" /> Security
            </h3>
            
            <div className="space-y-4">
              <AnimatedButton variant="secondary" className="w-full flex items-center justify-center gap-2" icon={Key}>
                Change Password
              </AnimatedButton>
              <button className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors">
                Enable Two-Factor Auth
              </button>
            </div>
          </PremiumCard>
        </div>

      </div>
    </DashboardShell>
  );
}
