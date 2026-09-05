import { create } from "zustand";
import Cookies from "js-cookie";
import { authApi } from "./apiClient";

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  loadCurrentUser: async () => {
    const token = Cookies.get("access_token");
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }
    try {
      const { data } = await authApi.me();
      set({ user: data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    Cookies.set("access_token", data.access_token, { expires: 1 });
    Cookies.set("refresh_token", data.refresh_token, { expires: 7 });
    const me = await authApi.me();
    set({ user: me.data, isLoading: false });
    return me.data;
  },

  logout: () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    set({ user: null, isLoading: false });
    if (typeof window !== "undefined") window.location.href = "/login";
  },
}));
