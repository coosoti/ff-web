"use client";
import { create } from "zustand";
import { analyticsApi } from "../api/analytics.api";
import {
  IncomeExpenseTrend, SpendingBreakdown, BudgetPerformance,
  SavingsProgress, NetworthSnapshot, FullReport,
} from "../../types";

interface AnalyticsState {
  incomeExpense: IncomeExpenseTrend | null;
  spending:      SpendingBreakdown | null;
  budget:        BudgetPerformance | null;
  savings:       SavingsProgress | null;
  networth:      NetworthSnapshot | null;
  report:        FullReport | null;
  months:        number;
  loading:       boolean;
  error:         string | null;

  setMonths:        (m: number) => void;
  fetchAll:         (months?: number) => Promise<void>;
  fetchIncomeExpense:(months?: number) => Promise<void>;
  fetchSpending:    (months?: number) => Promise<void>;
  fetchBudget:      (months?: number) => Promise<void>;
  fetchSavings:     () => Promise<void>;
  fetchNetworth:    () => Promise<void>;
  fetchReport:      (months?: number) => Promise<FullReport | null>;
  clearError:       () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  incomeExpense: null,
  spending:      null,
  budget:        null,
  savings:       null,
  networth:      null,
  report:        null,
  months:        12,
  loading:       false,
  error:         null,

  clearError: () => set({ error: null }),
  setMonths:  (m) => set({ months: m }),

  fetchAll: async (months) => {
    const m = months ?? get().months;
    set({ loading: true, error: null });
    try {
      const [ie, sp, bu, sa, nw] = await Promise.all([
        analyticsApi.getIncomeExpense(m),
        analyticsApi.getSpending(m),
        analyticsApi.getBudget(m),
        analyticsApi.getSavings(),
        analyticsApi.getNetworth(),
      ]);
      set({
        incomeExpense: ie.data.data,
        spending:      sp.data.data,
        budget:        bu.data.data,
        savings:       sa.data.data,
        networth:      nw.data.data,
        loading:       false,
      });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load analytics" });
    }
  },

  fetchIncomeExpense: async (months) => {
    const m = months ?? get().months;
    try {
      const { data } = await analyticsApi.getIncomeExpense(m);
      set({ incomeExpense: data.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to load income/expense" });
    }
  },

  fetchSpending: async (months) => {
    const m = months ?? get().months;
    try {
      const { data } = await analyticsApi.getSpending(m);
      set({ spending: data.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to load spending" });
    }
  },

  fetchBudget: async (months) => {
    const m = months ?? get().months;
    try {
      const { data } = await analyticsApi.getBudget(m);
      set({ budget: data.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to load budget performance" });
    }
  },

  fetchSavings: async () => {
    try {
      const { data } = await analyticsApi.getSavings();
      set({ savings: data.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to load savings progress" });
    }
  },

  fetchNetworth: async () => {
    try {
      const { data } = await analyticsApi.getNetworth();
      set({ networth: data.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to load net worth" });
    }
  },

  fetchReport: async (months) => {
    const m = months ?? get().months;
    set({ loading: true, error: null });
    try {
      const { data } = await analyticsApi.getReport(m);
      set({ report: data.data, loading: false });
      return data.data;
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to generate report" });
      return null;
    }
  },
}));