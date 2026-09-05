"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import LoadingScreen from "@/components/ui/LoadingScreen";

/**
 * /dashboard — Role-based redirect.
 * Reads JWT role and sends each user to their dedicated dashboard URL.
 * Never shows a dashboard selection screen.
 */
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isLoading, loadCurrentUser } = useAuthStore();

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Role → URL mapping (role values from MySQL / JWT)
    const roleRoutes = {
      patient: "/patient/dashboard",
      doctor:  "/doctor/dashboard",
      clinic:  "/provider/dashboard",
      admin:   "/admin/dashboard",
    };

    const destination = roleRoutes[user.role] || "/login";
    router.replace(destination);
  }, [user, isLoading, router]);

  return <LoadingScreen message="Redirecting to your dashboard…" />;
}
