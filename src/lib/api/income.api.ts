import { apiClient } from "./client";
import { IncomeEntry, IncomeMonth } from "../../types";

export const incomeApi = {
  getByMonth: (month: string) =>
    apiClient.get<{ success: true; data: IncomeMonth }>(`/income?month=${month}`),

  create: (data: { amount: number; source: string; month: string; notes?: string }) =>
    apiClient.post<{ success: true; data: IncomeEntry }>("/income", data),

  update: (id: string, data: Partial<{ amount: number; source: string; notes: string }>) =>
    apiClient.put<{ success: true; data: IncomeEntry }>(`/income/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/income/${id}`),
};