"use client";

import { useEffect, useState } from "react";
import {
  Users, UserCheck, Stethoscope, Building, Search,
  ToggleLeft, ToggleRight, RefreshCw, ChevronLeft, ChevronRight, X, Shield
} from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/lib/authStore";
import { adminApi } from "@/lib/apiClient";
import { ADMIN_NAV } from "../adminNav";

const ROLE_CFG = {
  patient: { label: "Patient",  badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",        avatar: "bg-blue-600"   },
  doctor:  { label: "Doctor",   badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", avatar: "bg-emerald-600" },
  clinic:  { label: "Provider", badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",   avatar: "bg-violet-600"  },
  admin:   { label: "Admin",    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",         avatar: "bg-rose-600"    },
};

const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const { user, isLoading, logout } = useAuthStore();
  const [allUsers, setAllUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { if (!isLoading && user) loadData(); }, [user, isLoading]);

  useEffect(() => {
    let f = [...allUsers];
    if (search) f = f.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    if (roleFilter !== "all") f = f.filter(u => u.role === roleFilter);
    if (statusFilter !== "all") f = f.filter(u => statusFilter === "active" ? u.is_active : !u.is_active);
    setFiltered(f);
    setPage(1);
  }, [search, roleFilter, statusFilter, allUsers]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await adminApi.listUsers();
      setAllUsers(res.data || []);
      setFiltered(res.data || []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); setRefreshing(false); }
  }

  async function handleToggle(uid) {
    setToggling(uid);
    try {
      await adminApi.toggleUserActive(uid);
      setToast({ msg: "User status updated.", type: "success" });
      setTimeout(() => setToast(null), 3000);
      loadData();
    } catch (e) {
      setToast({ msg: "Failed to update user.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
    finally { setToggling(null); }
  }

  if (isLoading || pageLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoadingSpinner text="Loading Users..." /></div>;
  }

  const navWithLogout = ADMIN_NAV.map(s => ({
    ...s,
    items: s.items.map(i => i.label === "Logout" ? { ...i, onClick: logout } : i),
  }));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = {
    all: allUsers.length,
    patient: allUsers.filter(u => u.role === "patient").length,
    doctor: allUsers.filter(u => u.role === "doctor").length,
    clinic: allUsers.filter(u => u.role === "clinic").length,
    admin: allUsers.filter(u => u.role === "admin").length,
  };

  return (
    <DashboardShell navItems={navWithLogout} role="admin">
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          subtitle={`${allUsers.length} registered users across all roles.`}
          breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Users" }]}
          actions={
            <AnimatedButton variant="secondary" onClick={loadData} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
            </AnimatedButton>
          }
        />

        {toast && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
            {toast.msg}
          </div>
        )}

        {/* Role Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total",     value: counts.all,      icon: Users,       color: "from-indigo-600 to-blue-500"    },
            { label: "Patients",  value: counts.patient,  icon: UserCheck,   color: "from-blue-600 to-cyan-500"      },
            { label: "Doctors",   value: counts.doctor,   icon: Stethoscope, color: "from-emerald-600 to-teal-500"   },
            { label: "Providers", value: counts.clinic,   icon: Building,    color: "from-violet-600 to-purple-500"  },
            { label: "Admins",    value: counts.admin,    icon: Shield,      color: "from-rose-600 to-pink-500"      },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <PremiumCard key={label} delay={i * 0.06} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-extrabold text-white">{value}</p>
              </div>
            </PremiumCard>
          ))}
        </div>

        {/* Search & Filters */}
        <PremiumCard className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full bg-slate-800/30 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-medium"
              />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-slate-800/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-medium">
              <option value="all">All Roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="clinic">Providers</option>
              <option value="admin">Admins</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-medium">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(search || roleFilter !== "all" || statusFilter !== "all") && (
              <button onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/30 border border-white/10 transition-colors">
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </PremiumCard>

        {/* Table */}
        <PremiumCard className="p-0 overflow-hidden">
          {paged.length === 0 ? (
            <div className="p-8"><EmptyState icon={Users} title="No Users Found" description="No users match the current filter." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-800/20">
                  {paged.map(u => {
                    const cfg = ROLE_CFG[u.role] || ROLE_CFG.patient;
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.avatar}`}>
                              {u.full_name?.[0] || "U"}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{u.full_name}</p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                        </td>
                        <td className="p-4 text-slate-400 text-xs font-medium">{u.phone_number || "—"}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-red-500"}`} />
                            <span className={`text-xs font-bold ${u.is_active ? "text-emerald-400" : "text-red-400"}`}>
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-400 font-medium">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggle(u.id)}
                            disabled={toggling === u.id}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border transition-colors disabled:opacity-50 ${u.is_active ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"}`}>
                            {toggling === u.id ? "..." : u.is_active
                              ? <><ToggleRight size={13} /> Deactivate</>
                              : <><ToggleLeft size={13} /> Activate</>
                            }
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <p className="text-xs text-slate-400 font-medium">
                {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} - {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg bg-slate-800/30 border border-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-40">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === page ? "bg-indigo-600 text-white" : "bg-slate-800/30 border border-white/10 text-slate-400 hover:text-white"}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg bg-slate-800/30 border border-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-40">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </PremiumCard>
      </div>
    </DashboardShell>
  );
}
