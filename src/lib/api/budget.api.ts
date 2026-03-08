import { apiClient } from "./client";
import { BudgetCategory, BudgetSummary, BudgetType } from "../../types";

export const budgetApi = {
  getCategories: () =>
    apiClient.get<{ success: true; data: BudgetCategory[] }>("/budget/categories"),

  createCategory: (data: { name: string; type: BudgetType; budgeted_amount: number }) =>
    apiClient.post<{ success: true; data: BudgetCategory }>("/budget/categories", data),

  updateCategory: (id: string, data: Partial<{ name: string; type: BudgetType; budgeted_amount: number }>) =>
    apiClient.put<{ success: true; data: BudgetCategory }>(`/budget/categories/${id}`, data),

  deleteCategory: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/budget/categories/${id}`),

  recalculate: (monthly_income: number) =>
    apiClient.post<{ success: true; data: BudgetCategory[] }>("/budget/recalculate", { monthly_income }),

  getSummary: (month: string) =>
    apiClient.get<{ success: true; data: BudgetSummary }>(`/budget/summary?month=${month}`),
};