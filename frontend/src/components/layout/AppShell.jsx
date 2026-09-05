"use client";

import { useAuthStore } from "@/lib/authStore";
import DashboardShell from "./DashboardShell";
import {
  LayoutDashboard, Stethoscope, FileText, BarChart3, LogOut, User, Calendar, Bell, Settings, ClipboardList, Brain, Lightbulb
} from "lucide-react";

// Legacy AppShell — now delegates to new DashboardShell
// Detects user role and selects appropriate nav items
const PATIENT_NAV = [
  { label: "Main", items: [
    { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patient/profile",   label: "Profile",   icon: User },
  ]},
  { label: "Tools", items: [
    { href: "/symptoms",  label: "Symptom Checker", icon: Stethoscope },
    { href: "/reports",   label: "Health Reports",  icon: FileText },
    { href: "/analytics", label: "Analytics",       icon: BarChart3 },
  ]},
  { label: "Account", items: [
    { href: "#", label: "Logout", icon: LogOut },
  ]},
];

const DOCTOR_NAV = [
  { label: "Main", items: [
    { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
  ]},
  { label: "Account", items: [
    { href: "#", label: "Logout", icon: LogOut },
  ]},
];

const PROVIDER_NAV = [
  { label: "Main", items: [
    { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analytics",          label: "Analytics",  icon: BarChart3 },
  ]},
  { label: "Account", items: [
    { href: "#", label: "Logout", icon: LogOut },
  ]},
];

const ADMIN_NAV = [
  { label: "Main", items: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { label: "Account", items: [
    { href: "#", label: "Logout", icon: LogOut },
  ]},
];

export default function AppShell({ children }) {
  const { user } = useAuthStore();
  const role = user?.role || "patient";

  const navMap = {
    patient: PATIENT_NAV,
    doctor:  DOCTOR_NAV,
    clinic:  PROVIDER_NAV,
    admin:   ADMIN_NAV,
  };

  const nav = navMap[role] || PATIENT_NAV;

  return (
    <DashboardShell navItems={nav} role={role}>
      {children}
    </DashboardShell>
  );
}
