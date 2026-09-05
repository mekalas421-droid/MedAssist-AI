"use client";

import { useEffect, useState } from "react";
import { Users, User, RefreshCw, Search, Filter } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { PROVIDER_NAV } from "../providerNav";

const RISK_BADGE = {
  low:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high:     "bg-red-500/10 text-red-400 border-red-500/20",
  critical: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export default function PatientReportsPage() {
  const { user, isLoading } = useAuthStore();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(patients.filter(p =>
      p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    ));
  }, [search, patients]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await adminApi.listUsers();
      const patientList = (res.data || []).filter(u => u.role === "patient" || u.role === "PATIENT");
      setPatients(patientList);
      setFiltered(patientList);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Patient Reports..." /></div>;

  const navWithLogout = PROVIDER_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: () => useAuthStore.getState().logout() } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="clinic">
      <div className="space-y-6">
        <PageHeader
          title="Patient Reports"
          subtitle={`${patients.length} registered patients across the network.`}
          breadcrumbs={[{ label: "Dashboard", href: "/provider/dashboard" }, { label: "Patient Reports" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>}
        />

        {/* Summary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Patients", value: patients.length, color: "from-blue-600 to-cyan-500" },
            { label: "Active", value: patients.filter(p => p.is_active).length, color: "from-emerald-600 to-teal-500" },
            { label: "Inactive", value: patients.filter(p => !p.is_active).length, color: "from-red-600 to-rose-500" },
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
              placeholder="Search by name or email…"
              className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 font-medium"
            />
          </div>
        </PremiumCard>

        {/* Table */}
        <PremiumCard className="p-6 overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No Patients Found" description={search ? "No results match your search." : "No patient records available yet."} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-800/20">
                  {filtered.map((p, i) => (
                    <tr key={p.id || i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {(p.full_name || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-white">{p.full_name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 font-medium">{p.email || "—"}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${p.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-700/30 text-slate-400 border-slate-700/30"}`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-medium">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
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
