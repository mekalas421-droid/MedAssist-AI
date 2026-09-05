"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

// This is a placeholder page to ensure no missing routes exist
export default function ComingSoonPage() {
  const { user } = useAuthStore();
  
  // A generic fallback for navigation items
  const NAV = [{ label: "Navigation", items: [{ href: "/doctor/dashboard", label: "Dashboard", icon: AlertCircle }] }];

  return (
    <DashboardShell navItems={NAV} role={user?.role || "patient"}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeUp">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="text-brand-500" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-navy-900 mb-4">Coming Soon</h1>
        <p className="text-navy-800/60 max-w-md">
          This premium module is currently under active development. Our engineering team is finalizing the data integrations for this view.
        </p>
      </div>
    </DashboardShell>
  );
}
