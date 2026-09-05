import { create } from "zustand";
import type { AdminUser } from "@/types";
import { setClientToken, clearClientToken } from "@/lib/api/client";

interface AuthStore {
  accessToken: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setAuth: (token: string, user: AdminUser) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setBootstrapping: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setAuth: (token, user) => {
    setClientToken(token);
    set({ accessToken: token, user, isAuthenticated: true, isBootstrapping: false });
  },

  setAccessToken: (token) => {
    setClientToken(token);
    set({ accessToken: token, isAuthenticated: true });
  },

  clearAuth: () => {
    clearClientToken();
    set({ accessToken: null, user: null, isAuthenticated: false, isBootstrapping: false });
  },

  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));
