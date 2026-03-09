import { apiClient } from "./client";
import { Investment, InvestmentType, PortfolioSummary } from "../../types";

export const investmentsApi = {
  getPortfolio: () =>
    apiClient.get<{ success: true; data: PortfolioSummary }>("/investments/portfolio"),

  getAll: () =>
    apiClient.get<{ success: true; data: Investment[] }>("/investments"),

  getById: (id: string) =>
    apiClient.get<{ success: true; data: Investment }>(`/investments/${id}`),

  create: (data: {
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
  }) => apiClient.post<{ success: true; data: Investment }>("/investments", data),

  update: (id: string, data: Partial<{
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
  }>) => apiClient.put<{ success: true; data: Investment }>(`/investments/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: true; message: string }>(`/investments/${id}`),
};