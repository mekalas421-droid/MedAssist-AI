"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

/**
 * Redirects to /login if there is no authenticated user.
 * Call inside any protected page component.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { user, isLoading, loadCurrentUser } = useAuthStore();

  useEffect(() => {
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  return { user, isLoading };
}
