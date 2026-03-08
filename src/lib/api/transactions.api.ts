import { apiClient } from "./client";
import { Transaction, TransactionType } from "../../types";

export const transactionsApi = {
  getAll: (month?: string) =>
    apiClient.get<{ success: true; data: Transaction[] }>(
      month ? `/transactions?month=${month}` : "/transactions"
    ),

  getById: (id: string) =>
    apiClient.get<{ success: true; data: Transaction }>(`/transactions/${id}`),

  create: (data: {
    category_id?: string;
    amount: number;
    type: TransactionType;
    date: string;
    notes?: string;
  }) => apiClient.post<{ success: true; data: Transaction }>("/transactions", data),

  update: (id: string, data: Partial<{
    category_id: string;
    amount: number;
    type: TransactionType;
    date: string;
    notes: string;
  }>) => apiClient.put<{ success: true; data: Transaction }>(`/transactions/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/transactions/${id}`),
};