import {
  LayoutDashboard, Users, UserCheck, Stethoscope, Building,
  Pill, BugPlay, FileText, ScrollText, ClipboardList,
  BarChart3, Settings, LogOut, Bell,
} from "lucide-react";

export const ADMIN_NAV = [
  {
    label: "Control Center",
    items: [
      { href: "/admin/dashboard", label: "Dashboard",       icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics",       icon: BarChart3 },
    ],
  },
  {
    label: "User Management",
    items: [
      { href: "/admin/users",     label: "All Users",       icon: Users },
      { href: "/admin/patients",  label: "Patients",        icon: UserCheck },
      { href: "/admin/doctors",   label: "Doctors",         icon: Stethoscope },
      { href: "/admin/providers", label: "Providers",       icon: Building },
    ],
  },
  {
    label: "Medical Catalog",
    items: [
      { href: "/admin/symptoms",  label: "Symptoms",        icon: Pill },
      { href: "/admin/diseases",  label: "Diseases",        icon: BugPlay },
    ],
  },
  {
    label: "Reports & Logs",
    items: [
      { href: "/admin/reports",   label: "Reports",         icon: FileText },
      { href: "/admin/activity",  label: "Activity Logs",   icon: ScrollText },
      { href: "/admin/audit",     label: "Audit Logs",      icon: ClipboardList },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings",  label: "Settings",        icon: Settings },
      { href: "#",                label: "Logout",          icon: LogOut },
    ],
  },
];
