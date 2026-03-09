"use client";
import { create } from "zustand";
import { pensionApi } from "../api/pension.api";
import { PensionAccount, PensionFund, PensionWithdrawal, PensionProjection } from "../../types";

interface PensionState {
  accounts: PensionAccount[];
  funds: Record<string, PensionFund[]>;
  withdrawals: Record<string, PensionWithdrawal[]>;
  projections: Record<string, PensionProjection>;
  loading: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  createAccount: (data: {
    provider: string; scheme_name: string; total_value: number;
    retirement_age?: number; date_of_birth?: string; notes?: string;
  }) => Promise<void>;
  updateAccount: (id: string, data: Partial<{
    provider: string; scheme_name: string; total_value: number;
    retirement_age: number; date_of_birth: string; notes: string;
  }>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  fetchFunds: (accountId: string) => Promise<void>;
  upsertFunds: (accountId: string, funds: { name: string; allocation_pct: number; current_value: number }[]) => Promise<void>;

  fetchWithdrawals: (accountId: string) => Promise<void>;
  createWithdrawal: (accountId: string, data: { amount: number; reason?: string; date: string; notes?: string }) => Promise<void>;
  deleteWithdrawal: (accountId: string, withdrawalId: string) => Promise<void>;

  fetchProjection: (accountId: string) => Promise<void>;

  clearError: () => void;
}

export const usePensionStore = create<PensionState>((set, get) => ({
  accounts:    [],
  funds:       {},
  withdrawals: {},
  projections: {},
  loading:     false,
  error:       null,

  clearError: () => set({ error: null }),

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await pensionApi.getAccounts();
      set({ accounts: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load pension accounts" });
    }
  },

  createAccount: async (payload) => {
    set({ loading: true, error: null });
    try {
      await pensionApi.createAccount(payload);
      const { data } = await pensionApi.getAccounts();
      set({ accounts: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to create account" });
      throw err;
    }
  },

  updateAccount: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      await pensionApi.updateAccount(id, payload);
      const { data } = await pensionApi.getAccounts();
      set({ accounts: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update account" });
      throw err;
    }
  },

  deleteAccount: async (id) => {
    set({ loading: true, error: null });
    try {
      await pensionApi.deleteAccount(id);
      set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id), loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete account" });
      throw err;
    }
  },

  fetchFunds: async (accountId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await pensionApi.getFunds(accountId);
      set((s) => ({ funds: { ...s.funds, [accountId]: data.data }, loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load funds" });
    }
  },

  upsertFunds: async (accountId, funds) => {
    set({ loading: true, error: null });
    try {
      await pensionApi.upsertFunds(accountId, funds);
      const { data } = await pensionApi.getFunds(accountId);
      set((s) => ({ funds: { ...s.funds, [accountId]: data.data }, loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to save funds" });
      throw err;
    }
  },

  fetchWithdrawals: async (accountId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await pensionApi.getWithdrawals(accountId);
      set((s) => ({ withdrawals: { ...s.withdrawals, [accountId]: data.data }, loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load withdrawals" });
    }
  },

  createWithdrawal: async (accountId, payload) => {
    set({ loading: true, error: null });
    try {
      await pensionApi.createWithdrawal(accountId, payload);
      const [wRes, aRes] = await Promise.all([
        pensionApi.getWithdrawals(accountId),
        pensionApi.getAccounts(),
      ]);
      set((s) => ({
        withdrawals: { ...s.withdrawals, [accountId]: wRes.data.data },
        accounts: aRes.data.data,
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to create withdrawal" });
      throw err;
    }
  },

  deleteWithdrawal: async (accountId, withdrawalId) => {
    set({ loading: true, error: null });
    try {
      await pensionApi.deleteWithdrawal(accountId, withdrawalId);
      const [wRes, aRes] = await Promise.all([
        pensionApi.getWithdrawals(accountId),
        pensionApi.getAccounts(),
      ]);
      set((s) => ({
        withdrawals: { ...s.withdrawals, [accountId]: wRes.data.data },
        accounts: aRes.data.data,
        loading: false,
      }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete withdrawal" });
      throw err;
    }
  },

  fetchProjection: async (accountId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await pensionApi.getProjection(accountId);
      set((s) => ({ projections: { ...s.projections, [accountId]: data.data }, loading: false }));
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load projection" });
    }
  },
}));