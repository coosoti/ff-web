"use client";
import { create } from "zustand";
import { incomeApi } from "../api/income.api";
import { IncomeEntry } from "../../types";

interface IncomeState {
  entries: IncomeEntry[];
  total: number;
  loading: boolean;
  error: string | null;

  fetchIncome: (month: string) => Promise<void>;
  createIncome: (data: { amount: number; source: string; month: string; notes?: string }) => Promise<void>;
  updateIncome: (id: string, data: Partial<{ amount: number; source: string; notes: string }>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useIncomeStore = create<IncomeState>((set, get) => ({
  entries: [],
  total: 0,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchIncome: async (month) => {
    set({ loading: true, error: null });
    try {
      const { data } = await incomeApi.getByMonth(month);
      set({ entries: data.data.entries, total: data.data.total, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load income" });
    }
  },

  createIncome: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await incomeApi.create(payload);
      const newEntry = data.data;
      const newTotal = get().total + Number(newEntry.amount);
      set((s) => ({ entries: [newEntry, ...s.entries], total: newTotal, loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to add income" });
      throw err;
    }
  },

  updateIncome: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await incomeApi.update(id, payload);
      const updated = data.data;
      set((s) => {
        const entries = s.entries.map((e) => (e.id === id ? updated : e));
        const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
        return { entries, total, loading: false };
      });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update income" });
      throw err;
    }
  },

  deleteIncome: async (id) => {
    set({ loading: true, error: null });
    try {
      await incomeApi.delete(id);
      set((s) => {
        const entries = s.entries.filter((e) => e.id !== id);
        const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
        return { entries, total, loading: false };
      });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete income" });
      throw err;
    }
  },
}));