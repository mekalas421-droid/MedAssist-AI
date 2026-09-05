"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Search, RefreshCw } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

export default function AdminDoctorsPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(doctors.filter(d => d.full_name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q)));
  }, [search, doctors]);

  async function loadData() {
    try {
      const res = await adminApi.listUsers();
      const docList = (res.data || []).filter(u => u.role === "doctor");
      setDoctors(docList);
      setFiltered(docList);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Doctors..." /></div>;
  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader title="Doctor Registry" subtitle={`${doctors.length} registered doctors.`}
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Doctors" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData}><RefreshCw size={15} /> Refresh</AnimatedButton>}
        />
        <PremiumCard className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
          </div>
        </PremiumCard>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full"><PremiumCard className="p-8"><EmptyState icon={Stethoscope} title="No Doctors Found" description="No doctors are registered yet." /></PremiumCard></div>
          ) : filtered.map((d, i) => (
            <PremiumCard key={d.id} delay={i * 0.04} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shrink-0">{d.full_name?.[0] || "D"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{d.full_name}</p>
                  <p className="text-xs text-slate-400 truncate mb-2">{d.email}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${d.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{d.is_active ? "Active" : "Inactive"}</span>
                    {d.is_verified && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">Verified</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500 font-medium">{d.phone_number || "No phone"} · Joined {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</div>
            </PremiumCard>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
