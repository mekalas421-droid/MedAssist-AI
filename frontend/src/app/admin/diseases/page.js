"use client";

import { useEffect, useState } from "react";
import { BugPlay, Search, RefreshCw, Plus, Trash2 } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

export default function AdminDiseasesPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [diseases, setDiseases] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  const [showAdd, setShowAdd] = useState(false);
  const [newDisease, setNewDisease] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(diseases.filter(d => d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)));
  }, [search, diseases]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await adminApi.listDiseases();
      setDiseases(res.data || []);
      setFiltered(res.data || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this disease?")) return;
    try {
      await adminApi.deleteDisease(id);
      loadData();
    } catch (e) { console.error(e); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newDisease.name) return;
    setSubmitting(true);
    try {
      await adminApi.createDisease(newDisease);
      setShowAdd(false);
      setNewDisease({ name: "", description: "" });
      loadData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Diseases..." /></div>;
  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Disease Management"
          subtitle={`${diseases.length} known conditions in the diagnostic engine.`}
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Diseases" }]}
          actions={
            <div className="flex gap-3">
              <AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>
              <AnimatedButton onClick={() => setShowAdd(!showAdd)} icon={showAdd ? undefined : Plus}>{showAdd ? "Cancel" : "Add Disease"}</AnimatedButton>
            </div>
          }
        />

        {showAdd && (
          <PremiumCard className="p-6 border-indigo-500/30">
            <h3 className="font-bold text-white mb-4">Add New Disease</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Disease Name</label>
                <input value={newDisease.name} onChange={e => setNewDisease(d => ({ ...d, name: e.target.value }))} required placeholder="e.g., Acute Bronchitis" className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Description</label>
                <textarea value={newDisease.description} onChange={e => setNewDisease(d => ({ ...d, description: e.target.value }))} rows={2} placeholder="Brief description of the condition..." className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none resize-none" />
              </div>
              <div className="flex justify-end">
                <AnimatedButton type="submit" disabled={!newDisease.name || submitting} isLoading={submitting}>Save Disease</AnimatedButton>
              </div>
            </form>
          </PremiumCard>
        )}

        <PremiumCard className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search diseases..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
          </div>
        </PremiumCard>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full"><PremiumCard className="p-8"><EmptyState icon={BugPlay} title="No Diseases Found" description="Try a different search or add a new disease." /></PremiumCard></div>
          ) : filtered.map((dis, i) => (
            <PremiumCard key={dis.id} delay={i * 0.02} className="p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg"><BugPlay size={18} className="text-white" /></div>
                <button onClick={() => handleDelete(dis.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
              </div>
              <h3 className="font-bold text-white text-lg leading-tight mb-2">{dis.name}</h3>
              <p className="text-xs text-slate-400 font-medium line-clamp-3 mb-4">{dis.description || "No description provided."}</p>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <span>ID: {(dis.id + "").substring(0,8)}</span>
              </div>
            </PremiumCard>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
