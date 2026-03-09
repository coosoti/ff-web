import { apiClient } from "./client";
import {
  PensionAccount, PensionFund, PensionWithdrawal, PensionProjection,
} from "../../types";

export const pensionApi = {
  // Accounts
  getAccounts: () =>
    apiClient.get<{ success: true; data: PensionAccount[] }>("/pension"),

  getAccount: (accountId: string) =>
    apiClient.get<{ success: true; data: PensionAccount }>(`/pension/${accountId}`),

  createAccount: (data: {
    provider: string;
    scheme_name: string;
    total_value: number;
    retirement_age?: number;
    date_of_birth?: string;
    notes?: string;
  }) => apiClient.post<{ success: true; data: PensionAccount }>("/pension", data),

  updateAccount: (accountId: string, data: Partial<{
    provider: string;
    scheme_name: string;
    total_value: number;
    retirement_age: number;
    date_of_birth: string;
    notes: string;
  }>) => apiClient.put<{ success: true; data: PensionAccount }>(`/pension/${accountId}`, data),

  deleteAccount: (accountId: string) =>
    apiClient.delete<{ success: true; message: string }>(`/pension/${accountId}`),

  // Funds
  getFunds: (accountId: string) =>
    apiClient.get<{ success: true; data: PensionFund[] }>(`/pension/${accountId}/funds`),

  upsertFunds: (accountId: string, funds: { name: string; allocation_pct: number; current_value: number }[]) =>
    apiClient.put<{ success: true; data: PensionFund[] }>(`/pension/${accountId}/funds`, { funds }),

  // Withdrawals
  getWithdrawals: (accountId: string) =>
    apiClient.get<{ success: true; data: PensionWithdrawal[] }>(`/pension/${accountId}/withdrawals`),

  createWithdrawal: (accountId: string, data: {
    amount: number;
    reason?: string;
    date: string;
    notes?: string;
  }) => apiClient.post<{ success: true; data: PensionWithdrawal }>(`/pension/${accountId}/withdrawals`, data),

  deleteWithdrawal: (accountId: string, withdrawalId: string) =>
    apiClient.delete<{ success: true; message: string }>(`/pension/${accountId}/withdrawals/${withdrawalId}`),

  // Projection
  getProjection: (accountId: string) =>
    apiClient.get<{ success: true; data: PensionProjection }>(`/pension/${accountId}/projection`),
};