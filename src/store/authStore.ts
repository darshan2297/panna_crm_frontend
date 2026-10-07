import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("panna_crm_token", token);
      if (refreshToken) {
        localStorage.setItem("panna_crm_refresh_token", refreshToken);
      }
      localStorage.setItem("panna_crm_user", JSON.stringify(user));
    }
    set({
      user,
      token,
      refreshToken: refreshToken || null,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("panna_crm_token");
      localStorage.removeItem("panna_crm_refresh_token");
      localStorage.removeItem("panna_crm_user");
    }
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initAuth: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("panna_crm_token");
      const refreshToken = localStorage.getItem("panna_crm_refresh_token");
      const userStr = localStorage.getItem("panna_crm_user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({
            user,
            token,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
    }
    set({ isLoading: false });
  },
}));
