"use client";
import { create } from "zustand";
import { transactionsApi } from "../api/transactions.api";
import { Transaction, TransactionType } from "../../types";

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  fetchTransactions: (month?: string) => Promise<void>;
  createTransaction: (data: {
    category_id?: string;
    amount: number;
    type: TransactionType;
    date: string;
    notes?: string;
  }) => Promise<void>;
  updateTransaction: (id: string, data: Partial<{
    category_id: string;
    amount: number;
    type: TransactionType;
    date: string;
    notes: string;
  }>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Called by Socket.io events
  addFromSocket: (tx: Transaction) => void;
  updateFromSocket: (tx: Transaction) => void;
  removeFromSocket: (id: string) => void;
  clearError: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTransactions: async (month) => {
    set({ loading: true, error: null, transactions: [] });
    try {
      const { data } = await transactionsApi.getAll(month);
      set({ transactions: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load transactions" });
    }
  },

  createTransaction: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await transactionsApi.create(payload);
      set((s) => ({ transactions: [data.data, ...s.transactions], loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to create transaction" });
      throw err;
    }
  },

  updateTransaction: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await transactionsApi.update(id, payload);
      set((s) => ({
        transactions: s.transactions.map((t) => (t.id === id ? data.data : t)),
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update transaction" });
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      await transactionsApi.delete(id);
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id), loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete transaction" });
      throw err;
    }
  },

  // Socket.io handlers — called when server broadcasts events
  addFromSocket:    (tx) => set((s) => ({
    transactions: s.transactions.find((t) => t.id === tx.id)
      ? s.transactions  // already added via API response — skip
      : [tx, ...s.transactions]
  })),
  updateFromSocket: (tx) => set((s) => ({ transactions: s.transactions.map((t) => (t.id === tx.id ? tx : t)) })),
  removeFromSocket: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
}));