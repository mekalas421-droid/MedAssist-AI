"use client";

import { useEffect, useState } from "react";
import { Building, Search, RefreshCw } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

export default function AdminProvidersPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [providers, setProviders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(providers.filter(p => p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)));
  }, [search, providers]);

  async function loadData() {
    try {
      const res = await adminApi.listUsers();
      const provList = (res.data || []).filter(u => u.role === "clinic");
      setProviders(provList);
      setFiltered(provList);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Providers..." /></div>;
  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader title="Healthcare Providers" subtitle={`${providers.length} registered clinic/provider accounts.`}
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Providers" }]}
          actions={<AnimatedButton variant="secondary" onClick={loadData}><RefreshCw size={15} /> Refresh</AnimatedButton>}
        />
        <PremiumCard className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search providers..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
          </div>
        </PremiumCard>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full"><PremiumCard className="p-8"><EmptyState icon={Building} title="No Providers Found" description="No healthcare providers are registered yet." /></PremiumCard></div>
          ) : filtered.map((p, i) => (
            <PremiumCard key={p.id} delay={i * 0.04} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shrink-0">{p.full_name?.[0] || "P"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{p.full_name}</p>
                  <p className="text-xs text-slate-400 truncate mb-2">{p.email}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20">Provider</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${p.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{p.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500 font-medium">{p.phone_number || "No phone"} · Joined {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</div>
            </PremiumCard>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
