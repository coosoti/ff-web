import { apiClient } from "./client";
import { SavingsGoal } from "../../types";

export const savingsApi = {
  getAll: () =>
    apiClient.get<{ success: true; data: SavingsGoal[] }>("/savings"),

  getById: (id: string) =>
    apiClient.get<{ success: true; data: SavingsGoal }>(`/savings/${id}`),

  create: (data: {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
    notes?: string;
  }) => apiClient.post<{ success: true; data: SavingsGoal }>("/savings", data),

  update: (id: string, data: Partial<{
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    notes: string;
    is_completed: boolean;
  }>) => apiClient.put<{ success: true; data: SavingsGoal }>(`/savings/${id}`, data),

  topUp: (id: string, amount: number) =>
    apiClient.post<{ success: true; data: SavingsGoal }>(`/savings/${id}/topup`, { amount }),

  delete: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/savings/${id}`),
};