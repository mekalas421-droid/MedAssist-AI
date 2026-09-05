"use client";

import { useEffect, useState } from "react";
import { Calendar, RefreshCw, Search } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { appointmentApi } from "@/lib/apiClient";
import { PROVIDER_NAV } from "../providerNav";

const STATUS_CONFIG = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function ProviderAppointmentsPage() {
  const { user, isLoading } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(appointments.filter(a =>
      a.patient_name?.toLowerCase().includes(q) || a.doctor_name?.toLowerCase().includes(q)
    ));
  }, [search, appointments]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await appointmentApi.myAppointments();
      const apptList = res.data || [];
      setAppointments(apptList);
      setFiltered(apptList);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  async function cancelAppointment(id) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentApi.cancel(id);
      loadData();
    } catch (e) { console.error(e); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Appointments..." /></div>;

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));

  const upcomingCount = appointments.filter(a => a.status === "scheduled" && new Date(a.appointment_date) >= new Date()).length;

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Clinic Appointments"
          subtitle="Manage all upcoming and past appointments."
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Appointments" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {/* Summary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Appointments", value: appointments.length, color: "from-blue-600 to-cyan-500" },
            { label: "Upcoming", value: upcomingCount, color: "from-emerald-600 to-teal-500" },
            { label: "Cancelled", value: appointments.filter(a => a.status === "cancelled").length, color: "from-red-600 to-rose-500" },
            { label: "Filtered", value: filtered.length, color: "from-violet-600 to-purple-500" },
          ].map(({ label, value, color }, i) => (
            <PremiumCard key={label} delay={i * 0.06} className="p-5">
              <div className={`text-2xl font-extrabold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{value}</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </PremiumCard>
          ))}
        </div>

        {/* Search */}
        <PremiumCard className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient or doctor name..."
              className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 font-medium"
            />
          </div>
        </PremiumCard>

        {/* Table */}
        <PremiumCard className="p-6 overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Calendar} title="No Appointments Found" description={search ? "No results match your search." : "No appointments have been scheduled yet."} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-800/20">
                  {filtered.map((a, i) => (
                    <tr key={a.id || i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">
                          {a.appointment_date ? new Date(a.appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {a.appointment_date ? new Date(a.appointment_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-white">{a.patient_name || "Unknown"}</td>
                      <td className="p-4 font-bold text-blue-400">{a.doctor_name || "Unknown"}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[a.status] || STATUS_CONFIG.scheduled}`}>
                          {a.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {a.status === "scheduled" && (
                          <button 
                            onClick={() => cancelAppointment(a.id)}
                            className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PremiumCard>
      </div>
    </DashboardShell>
  );
}
