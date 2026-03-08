"use client";
import { create } from "zustand";
import { budgetApi } from "../api/budget.api";
import { BudgetCategory, BudgetSummary, BudgetType } from "../../types";

interface BudgetState {
  categories: BudgetCategory[];
  summary: BudgetSummary | null;
  loading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  createCategory: (name: string, type: BudgetType, budgeted_amount: number) => Promise<void>;
  updateCategory: (id: string, fields: Partial<{ name: string; type: BudgetType; budgeted_amount: number }>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  recalculate: (monthly_income: number) => Promise<void>;
  fetchSummary: (month: string) => Promise<void>;
  clearError: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  categories: [],
  summary: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await budgetApi.getCategories();
      set({ categories: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load categories" });
    }
  },

  createCategory: async (name, type, budgeted_amount) => {
    set({ loading: true, error: null });
    try {
      const { data } = await budgetApi.createCategory({ name, type, budgeted_amount });
      set((s) => ({ categories: [...s.categories, data.data], loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to create category" });
      throw err;
    }
  },

  updateCategory: async (id, fields) => {
    set({ loading: true, error: null });
    try {
      const { data } = await budgetApi.updateCategory(id, fields);
      set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? data.data : c)),
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update category" });
      throw err;
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      await budgetApi.deleteCategory(id);
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id), loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete category" });
      throw err;
    }
  },

  recalculate: async (monthly_income) => {
    set({ loading: true, error: null });
    try {
      const { data } = await budgetApi.recalculate(monthly_income);
      set({ categories: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to recalculate" });
      throw err;
    }
  },

  fetchSummary: async (month) => {
    set({ loading: true, error: null });
    try {
      const { data } = await budgetApi.getSummary(month);
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load summary" });
    }
  },
}));