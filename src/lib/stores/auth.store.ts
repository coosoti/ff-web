"use client";
import { create } from "zustand";
import { authApi } from "../api/auth.api";
import { User } from "../../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    monthly_income: number;
    dependents: number;
  }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      set({ user: data.data.user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Login failed" });
      throw err;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.register(payload);
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      set({ user: data.data.user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Registration failed" });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;
    try {
      const { data } = await authApi.me();
      set({ user: data.data, isAuthenticated: true });
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },
}));