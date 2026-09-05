"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function RoleGuard({ children, allowedRoles = [] }) {
  const { user, isLoading, loadCurrentUser } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    setIsReady(true);
  }, [user, isLoading, router]);

  if (isLoading || !isReady) {
    return <LoadingScreen message="Verifying access..." />;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const role = user.role?.toLowerCase() || "";
  
  // Admin can access all according to instructions: "Admin can access all."
  if (role === "admin") {
    return <>{children}</>;
  }

  // Clinic maps to provider internally usually, but let's check exact matches
  let hasAccess = allowedRoles.length === 0 || allowedRoles.includes(role);
  if (allowedRoles.includes("provider") && role === "clinic") hasAccess = true;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 50%, #312e81 100%)" }}>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 max-w-md w-full premium-card p-10 text-center animate-fadeUp border border-red-500/20"
             style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(24px)" }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <ShieldAlert className="text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" size={40} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">
            Access Restricted
          </h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            You do not have the required clinical permissions to view this module. Your current role (<span className="text-white font-medium capitalize">{role}</span>) is not authorized.
          </p>
          <button
            onClick={() => {
              if (role === "doctor") router.push("/doctor/dashboard");
              else if (role === "clinic" || role === "provider") router.push("/provider/dashboard");
              else router.push("/patient/dashboard");
            }}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 mb-4"
          >
            Return to Authorized Dashboard
          </button>
          
          <button onClick={() => useAuthStore.getState().logout()} className="text-sm font-medium text-slate-500 hover:text-white transition-colors">
            Sign out securely
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
