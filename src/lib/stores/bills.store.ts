"use client";
import { create } from "zustand";
import { billsApi } from "../api/bills.api";
import { Bill, BillCategory, BillCycle, BillPayment, BillsSummary } from "../../types";

interface BillsState {
  summary: BillsSummary | null;
  history: Record<string, BillPayment[]>;
  loading: boolean;
  error: string | null;

  fetchSummary: () => Promise<void>;
  createBill: (data: {
    name: string; amount: number; category: BillCategory;
    cycle: BillCycle; due_day: number; notes?: string;
  }) => Promise<void>;
  updateBill: (id: string, data: Partial<{
    name: string; amount: number; category: BillCategory;
    cycle: BillCycle; due_day: number; notes: string;
  }>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  markPaid:   (id: string, notes?: string) => Promise<void>;
  markUnpaid: (id: string) => Promise<void>;
  fetchHistory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useBillsStore = create<BillsState>((set, get) => ({
  summary: null,
  history: {},
  loading: false,
  error:   null,

  clearError: () => set({ error: null }),

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await billsApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load bills" });
    }
  },

  createBill: async (payload) => {
    set({ loading: true, error: null });
    try {
      await billsApi.create(payload);
      const { data } = await billsApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to create bill" });
      throw err;
    }
  },

  updateBill: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      await billsApi.update(id, payload);
      const { data } = await billsApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update bill" });
      throw err;
    }
  },

  deleteBill: async (id) => {
    set({ loading: true, error: null });
    try {
      await billsApi.delete(id);
      const { data } = await billsApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete bill" });
      throw err;
    }
  },

  markPaid: async (id, notes) => {
    set({ loading: true, error: null });
    try {
      await billsApi.markPaid(id, notes);
      const { data } = await billsApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to mark bill as paid" });
      throw err;
    }
  },

  markUnpaid: async (id) => {
    set({ loading: true, error: null });
    try {
      await billsApi.markUnpaid(id);
      const { data } = await billsApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to mark bill as unpaid" });
      throw err;
    }
  },

  fetchHistory: async (id) => {
    try {
      const { data } = await billsApi.getHistory(id);
      set((s) => ({ history: { ...s.history, [id]: data.data } }));
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to load history" });
    }
  },
}));