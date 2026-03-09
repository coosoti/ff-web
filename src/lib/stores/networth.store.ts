"use client";
import { create } from "zustand";
import { networthApi } from "../api/networth.api";
import { Asset, AssetCategory, Liability, LiabilityCategory, NetWorthSummary } from "../../types";

interface NetWorthState {
  summary: NetWorthSummary | null;
  loading: boolean;
  error: string | null;

  fetchSummary: () => Promise<void>;

  createAsset: (data: { name: string; category: AssetCategory; value: number; notes?: string }) => Promise<void>;
  updateAsset: (id: string, data: Partial<{ name: string; category: AssetCategory; value: number; notes: string }>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  createLiability: (data: { name: string; category: LiabilityCategory; balance: number; interest_rate?: number; notes?: string }) => Promise<void>;
  updateLiability: (id: string, data: Partial<{ name: string; category: LiabilityCategory; balance: number; interest_rate: number; notes: string }>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;

  clearError: () => void;
}

export const useNetworthStore = create<NetWorthState>((set) => ({
  summary: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await networthApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load net worth" });
    }
  },

  createAsset: async (payload) => {
    set({ loading: true, error: null });
    try {
      await networthApi.createAsset(payload);
      const { data } = await networthApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to add asset" });
      throw err;
    }
  },

  updateAsset: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      await networthApi.updateAsset(id, payload);
      const { data } = await networthApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update asset" });
      throw err;
    }
  },

  deleteAsset: async (id) => {
    set({ loading: true, error: null });
    try {
      await networthApi.deleteAsset(id);
      const { data } = await networthApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete asset" });
      throw err;
    }
  },

  createLiability: async (payload) => {
    set({ loading: true, error: null });
    try {
      await networthApi.createLiability(payload);
      const { data } = await networthApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to add liability" });
      throw err;
    }
  },

  updateLiability: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      await networthApi.updateLiability(id, payload);
      const { data } = await networthApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update liability" });
      throw err;
    }
  },

  deleteLiability: async (id) => {
    set({ loading: true, error: null });
    try {
      await networthApi.deleteLiability(id);
      const { data } = await networthApi.getSummary();
      set({ summary: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete liability" });
      throw err;
    }
  },
}));