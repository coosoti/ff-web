import { apiClient } from "./client";
import {
  IncomeExpenseTrend, SpendingBreakdown, BudgetPerformance,
  SavingsProgress, NetworthSnapshot, FullReport,
} from "../../types";

export const analyticsApi = {
  getIncomeExpense: (months = 12) =>
    apiClient.get<{ success: true; data: IncomeExpenseTrend }>(`/analytics/income-expense?months=${months}`),

  getSpending: (months = 12) =>
    apiClient.get<{ success: true; data: SpendingBreakdown }>(`/analytics/spending?months=${months}`),

  getBudget: (months = 12) =>
    apiClient.get<{ success: true; data: BudgetPerformance }>(`/analytics/budget?months=${months}`),

  getSavings: () =>
    apiClient.get<{ success: true; data: SavingsProgress }>("/analytics/savings"),

  getNetworth: () =>
    apiClient.get<{ success: true; data: NetworthSnapshot }>("/analytics/networth"),

  getReport: (months = 12) =>
    apiClient.get<{ success: true; data: FullReport }>(`/analytics/report?months=${months}`),
};