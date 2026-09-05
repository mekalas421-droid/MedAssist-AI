// Shared Provider navigation — import this in every provider page
import { LayoutDashboard, Building, TrendingUp, FileText, ShieldAlert, Lightbulb, BarChart3, Download, User, LogOut, Users, Bell, Settings, Calendar } from "lucide-react";

export const PROVIDER_NAV = [
  {
    label: "Overview",
    items: [
      { href: "/provider/dashboard",        label: "Dashboard",           icon: LayoutDashboard },
      { href: "/provider/overview",         label: "Hospital Overview",   icon: Building },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/provider/appointments",     label: "Appointments",        icon: Calendar },
      { href: "/provider/notifications",    label: "Notifications",       icon: Bell },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/provider/disease",          label: "Disease Analytics",   icon: TrendingUp },
      { href: "/provider/patients",         label: "Patient Reports",     icon: Users },
      { href: "/provider/risk",             label: "Risk Analysis",       icon: ShieldAlert },
      { href: "/provider/analytics",        label: "Analytics Hub",       icon: BarChart3 },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/provider/reports",          label: "Health Reports",      icon: FileText },
      { href: "/provider/recommendations",  label: "Recommendations",     icon: Lightbulb },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/provider/settings",         label: "Settings",            icon: Settings },
      { href: "#",                          label: "Logout",              icon: LogOut },
    ],
  },
];
