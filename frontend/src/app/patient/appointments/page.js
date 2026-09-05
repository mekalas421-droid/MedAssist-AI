"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Stethoscope, Video, MoreVertical, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";
import GlassTable from "@/components/ui/GlassTable";

const NAV = [
  {
    label: "Main",
    items: [
      { href: "/patient/dashboard", label: "Dashboard", icon: Calendar },
      { href: "/patient/appointments", label: "Appointments", icon: Calendar },
    ],
  }
];

export default function AppointmentsPage() {
  const { user, isLoading } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      loadAppointments();
    }
  }, [user, isLoading]);

  async function loadAppointments() {
    try {
      const res = await apiClient.get("/api/v1/appointments/me");
      // Format data if needed, or set directly
      let data = res.data || [];
      
      // Sort by date descending
      data.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }

  const columns = [
    {
      header: "Doctor / Provider",
      accessor: "doctor_name",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg">
            <Stethoscope size={18} />
          </div>
          <div>
            <p className="font-bold text-white">{val || `Provider ID: ${row.doctor_id}`}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{row.appointment_type || "Consultation"}</p>
          </div>
        </div>
      )
    },
    {
      header: "Date & Time",
      accessor: "appointment_date",
      render: (val) => {
        const d = new Date(val);
        return (
          <div>
            <p className="text-sm font-bold text-slate-200">{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <Clock size={12} /> {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        );
      }
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => {
        const isScheduled = val === "scheduled";
        const isCompleted = val === "completed";
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider
            ${isScheduled ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
              isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
              'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
            {isScheduled ? <Clock size={12} /> : isCompleted ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {val}
          </span>
        );
      }
    },
    {
      header: "Actions",
      accessor: "id",
      render: () => (
        <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <MoreVertical size={18} />
        </button>
      )
    }
  ];

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Appointments..." /></div>;

  return (
    <DashboardShell navItems={NAV} role="patient">
      <PageHeader 
        title="Appointments" 
        subtitle="Manage your upcoming consultations and review past visits."
        breadcrumbs={[{ label: "Dashboard", href: "/patient/dashboard" }, { label: "Appointments" }]}
        actions={
          <AnimatedButton icon={Plus}>
            Book Appointment
          </AnimatedButton>
        }
      />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumCard className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
              <Calendar size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming</p>
              <p className="text-2xl font-extrabold text-white leading-none mt-1">
                {appointments.filter(a => a.status === 'scheduled').length}
              </p>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg">
              <CheckCircle2 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
              <p className="text-2xl font-extrabold text-white leading-none mt-1">
                {appointments.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6 flex items-center gap-4 border-dashed border-2 border-slate-700/50 bg-slate-800/20">
             <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shadow-inner">
               <Video size={24} className="text-slate-400" />
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telehealth</p>
               <button className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors mt-1">
                 Join Waiting Room &rarr;
               </button>
             </div>
          </PremiumCard>
        </div>

        {/* List */}
        <PremiumCard className="p-0 overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                icon={Calendar} 
                title="No appointments scheduled" 
                description="You don't have any upcoming or past appointments in the system."
                actionLabel="Book New Consultation" 
              />
            </div>
          ) : (
            <GlassTable 
              data={appointments}
              columns={columns}
              onRowClick={(row) => console.log(row)}
            />
          )}
        </PremiumCard>

      </div>
    </DashboardShell>
  );
}
