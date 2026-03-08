"use client";
import { create } from "zustand";
import { savingsApi } from "../api/savings.api";
import { SavingsGoal } from "../../types";

interface SavingsState {
  goals: SavingsGoal[];
  loading: boolean;
  error: string | null;

  fetchGoals: () => Promise<void>;
  createGoal: (data: {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
    notes?: string;
  }) => Promise<void>;
  updateGoal: (id: string, data: Partial<{
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    notes: string;
    is_completed: boolean;
  }>) => Promise<void>;
  topUpGoal: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSavingsStore = create<SavingsState>((set) => ({
  goals: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await savingsApi.getAll();
      set({ goals: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load savings goals" });
    }
  },

  createGoal: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await savingsApi.create(payload);
      set((s) => ({ goals: [data.data, ...s.goals], loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to create goal" });
      throw err;
    }
  },

  updateGoal: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await savingsApi.update(id, payload);
      set((s) => ({ goals: s.goals.map((g) => (g.id === id ? data.data : g)), loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update goal" });
      throw err;
    }
  },

  topUpGoal: async (id, amount) => {
    set({ loading: true, error: null });
    try {
      const { data } = await savingsApi.topUp(id, amount);
      set((s) => ({ goals: s.goals.map((g) => (g.id === id ? data.data : g)), loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to top up goal" });
      throw err;
    }
  },

  deleteGoal: async (id) => {
    set({ loading: true, error: null });
    try {
      await savingsApi.delete(id);
      set((s) => ({ goals: s.goals.filter((g) => g.id !== id), loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete goal" });
      throw err;
    }
  },
}));