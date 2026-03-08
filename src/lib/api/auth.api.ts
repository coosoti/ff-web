import { apiClient } from "./client";
import { AuthResponse, AuthTokens, User } from "../../types";

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    monthly_income: number;
    dependents?: number;
  }) => apiClient.post<{ success: true; data: AuthResponse }>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ success: true; data: AuthResponse }>("/auth/login", data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ success: true; data: AuthTokens }>("/auth/refresh", { refreshToken }),

  forgotPassword: (email: string) =>
    apiClient.post<{ success: true; message: string }>("/auth/forgot-password", { email }),

  me: () =>
    apiClient.get<{ success: true; data: User }>("/auth/me"),
};