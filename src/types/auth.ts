// src/types/auth.ts
export interface User {
  id: string;
  email: string;
  name: string;
  monthly_income: number;
  dependents: number;
  currency: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  monthly_income: number;
  dependents: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}