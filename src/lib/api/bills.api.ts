import { apiClient } from "./client";
import { Bill, BillCategory, BillCycle, BillPayment, BillsSummary } from "../../types";

export const billsApi = {
  getSummary: () =>
    apiClient.get<{ success: true; data: BillsSummary }>("/bills/summary"),

  getAll: () =>
    apiClient.get<{ success: true; data: Bill[] }>("/bills"),

  getById: (id: string) =>
    apiClient.get<{ success: true; data: Bill }>(`/bills/${id}`),

  create: (data: {
    name: string; amount: number; category: BillCategory;
    cycle: BillCycle; due_day: number; notes?: string;
  }) => apiClient.post<{ success: true; data: Bill }>("/bills", data),

  update: (id: string, data: Partial<{
    name: string; amount: number; category: BillCategory;
    cycle: BillCycle; due_day: number; notes: string; is_active: boolean;
  }>) => apiClient.put<{ success: true; data: Bill }>(`/bills/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/bills/${id}`),

  markPaid: (id: string, notes?: string) =>
    apiClient.post<{ success: true; data: BillPayment }>(`/bills/${id}/pay`, { notes }),

  markUnpaid: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/bills/${id}/pay`),

  getHistory: (id: string) =>
    apiClient.get<{ success: true; data: BillPayment[] }>(`/bills/${id}/history`),
};