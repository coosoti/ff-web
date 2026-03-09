"use client";
import { create } from "zustand";
import { investmentsApi } from "../api/investments.api";
import { Investment, InvestmentType, PortfolioSummary } from "../../types";

interface InvestmentsState {
  portfolio: PortfolioSummary | null;
  loading: boolean;
  error: string | null;

  fetchPortfolio: () => Promise<void>;
  createInvestment: (data: {
    name: string;
    type: InvestmentType;
    institution?: string;
    units?: number;
    purchase_price?: number;
    current_price?: number;
    total_invested: number;
    current_value: number;
    purchase_date?: string;
    notes?: string;
  }) => Promise<void>;
  updateInvestment: (id: string, data: Partial<{
    name: string;
    type: InvestmentType;
    institution: string;
    units: number;
    purchase_price: number;
    current_price: number;
    total_invested: number;
    current_value: number;
    purchase_date: string;
    notes: string;
  }>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useInvestmentsStore = create<InvestmentsState>((set) => ({
  portfolio: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchPortfolio: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await investmentsApi.getPortfolio();
      set({ portfolio: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to load portfolio" });
    }
  },

  createInvestment: async (payload) => {
    set({ loading: true, error: null });
    try {
      await investmentsApi.create(payload);
      const { data } = await investmentsApi.getPortfolio();
      set({ portfolio: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to add investment" });
      throw err;
    }
  },

  updateInvestment: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      await investmentsApi.update(id, payload);
      const { data } = await investmentsApi.getPortfolio();
      set({ portfolio: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to update investment" });
      throw err;
    }
  },

  deleteInvestment: async (id) => {
    set({ loading: true, error: null });
    try {
      await investmentsApi.delete(id);
      const { data } = await investmentsApi.getPortfolio();
      set({ portfolio: data.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error ?? "Failed to delete investment" });
      throw err;
    }
  },
}));