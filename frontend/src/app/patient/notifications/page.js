"use client";

import { useEffect, useState } from "react";
import { Bell, Activity, CheckCircle2, ShieldAlert, CheckCheck, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";

const NAV = [
  {
    label: "Main",
    items: [
      { href: "/patient/dashboard", label: "Dashboard", icon: Activity },
      { href: "/patient/notifications", label: "Notifications", icon: Bell },
    ],
  }
];

export default function NotificationsPage() {
  const { user, isLoading } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      loadNotifications();
    }
  }, [user, isLoading]);

  async function loadNotifications() {
    try {
      const res = await apiClient.get("/api/v1/notifications/me");
      let data = res.data || [];
      data.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Notifications..." /></div>;

  return (
    <DashboardShell navItems={NAV} role="patient">
      <PageHeader 
        title="Notifications" 
        subtitle="System alerts, report updates, and appointment reminders."
        breadcrumbs={[{ label: "Dashboard", href: "/patient/dashboard" }, { label: "Notifications" }]}
        actions={
          <div className="flex gap-3">
            <AnimatedButton variant="secondary" icon={CheckCheck}>Mark All Read</AnimatedButton>
            <AnimatedButton variant="danger" icon={Trash2}>Clear All</AnimatedButton>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto space-y-4">
        {notifications.length === 0 ? (
          <EmptyState 
            icon={Bell} 
            title="You're all caught up!" 
            description="There are no new notifications for your account." 
          />
        ) : (
          notifications.map((notif, idx) => {
            const isRead = notif.is_read;
            const type = notif.type || 'info'; // e.g., 'info', 'alert', 'success'
            return (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <PremiumCard className={`p-4 flex gap-4 items-start transition-all hover:bg-slate-800/60 cursor-pointer ${!isRead ? 'border-l-4 border-l-blue-500' : 'opacity-80'}`}>
                  
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-lg
                    ${type === 'alert' ? 'bg-red-500/20 text-red-400' : 
                      type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                      'bg-blue-500/20 text-blue-400'}`}
                  >
                    {type === 'alert' ? <ShieldAlert size={18} /> : type === 'success' ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`font-bold text-base truncate ${!isRead ? 'text-white' : 'text-slate-300'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap ml-4">
                        {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    {notif.details && (
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">
                        {notif.details}
                      </p>
                    )}
                  </div>
                  
                  {!isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] mt-3 shrink-0" />
                  )}
                </PremiumCard>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
