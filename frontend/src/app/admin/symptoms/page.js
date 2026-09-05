"use client";

import { useEffect, useState } from "react";
import { Pill, Search, RefreshCw, Plus, Trash2, ShieldAlert } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

export default function AdminSymptomsPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [symptoms, setSymptoms] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  // Create form state
  const [showAdd, setShowAdd] = useState(false);
  const [newSymptom, setNewSymptom] = useState({ name: "", category: "", severity_weight: 1.0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(symptoms.filter(s => s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)));
  }, [search, symptoms]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await adminApi.listSymptoms();
      setSymptoms(res.data || []);
      setFiltered(res.data || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this symptom?")) return;
    try {
      await adminApi.deleteSymptom(id);
      loadData();
    } catch (e) { console.error(e); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newSymptom.name) return;
    setSubmitting(true);
    try {
      await adminApi.createSymptom(newSymptom);
      setShowAdd(false);
      setNewSymptom({ name: "", category: "", severity_weight: 1.0 });
      loadData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  }

  if (isLoading || pageLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Symptoms..." /></div>;
  const navWithLogout = ADMIN_NAV.map(s => ({ ...s, items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i) }));

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="Symptom Management"
          subtitle={`${symptoms.length} symptoms in the AI catalog.`}
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Symptoms" }]}
          actions={
            <div className="flex gap-3">
              <AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</AnimatedButton>
              <AnimatedButton onClick={() => setShowAdd(!showAdd)} icon={showAdd ? undefined : Plus}>{showAdd ? "Cancel" : "Add Symptom"}</AnimatedButton>
            </div>
          }
        />

        {showAdd && (
          <PremiumCard className="p-6 border-indigo-500/30">
            <h3 className="font-bold text-white mb-4">Add New Symptom</h3>
            <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Symptom Name</label>
                <input value={newSymptom.name} onChange={e => setNewSymptom(s => ({ ...s, name: e.target.value }))} required placeholder="e.g., Severe Headache" className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none" />
              </div>
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Category</label>
                <input value={newSymptom.category} onChange={e => setNewSymptom(s => ({ ...s, category: e.target.value }))} placeholder="e.g., Neurological" className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none" />
              </div>
              <div className="space-y-2 w-32">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Weight (0-5)</label>
                <input type="number" step="0.1" min="0" max="5" value={newSymptom.severity_weight} onChange={e => setNewSymptom(s => ({ ...s, severity_weight: parseFloat(e.target.value) || 1.0 }))} className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none" />
              </div>
              <AnimatedButton type="submit" disabled={!newSymptom.name || submitting} isLoading={submitting}>Save</AnimatedButton>
            </form>
          </PremiumCard>
        )}

        <PremiumCard className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symptoms..." className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium" />
          </div>
        </PremiumCard>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full"><PremiumCard className="p-8"><EmptyState icon={Pill} title="No Symptoms Found" description="Try a different search or add a new symptom." /></PremiumCard></div>
          ) : filtered.map((sym, i) => (
            <PremiumCard key={sym.id} delay={i * 0.02} className="p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg"><Pill size={18} className="text-white" /></div>
                <button onClick={() => handleDelete(sym.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
              </div>
              <h3 className="font-bold text-white text-lg leading-tight mb-1">{sym.name}</h3>
              <p className="text-xs text-slate-400 font-medium mb-4">{sym.category || "Uncategorized"}</p>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Severity Weight</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sym.severity_weight > 3 ? "bg-red-500/10 text-red-400 border-red-500/20" : sym.severity_weight > 1.5 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                  {sym.severity_weight?.toFixed(1)}
                </span>
              </div>
            </PremiumCard>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
