import { apiClient } from "./client";
import { Asset, AssetCategory, Liability, LiabilityCategory, NetWorthSummary } from "../../types";

export const networthApi = {
  getSummary: () =>
    apiClient.get<{ success: true; data: NetWorthSummary }>("/networth"),

  // Assets
  getAssets: () =>
    apiClient.get<{ success: true; data: Asset[] }>("/networth/assets"),

  createAsset: (data: { name: string; category: AssetCategory; value: number; notes?: string }) =>
    apiClient.post<{ success: true; data: Asset }>("/networth/assets", data),

  updateAsset: (id: string, data: Partial<{ name: string; category: AssetCategory; value: number; notes: string }>) =>
    apiClient.put<{ success: true; data: Asset }>(`/networth/assets/${id}`, data),

  deleteAsset: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/networth/assets/${id}`),

  // Liabilities
  getLiabilities: () =>
    apiClient.get<{ success: true; data: Liability[] }>("/networth/liabilities"),

  createLiability: (data: {
    name: string;
    category: LiabilityCategory;
    balance: number;
    interest_rate?: number;
    notes?: string;
  }) => apiClient.post<{ success: true; data: Liability }>("/networth/liabilities", data),

  updateLiability: (id: string, data: Partial<{
    name: string;
    category: LiabilityCategory;
    balance: number;
    interest_rate: number;
    notes: string;
  }>) => apiClient.put<{ success: true; data: Liability }>(`/networth/liabilities/${id}`, data),

  deleteLiability: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/networth/liabilities/${id}`),
};