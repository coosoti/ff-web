// types/index.ts
// Add types here module by module as we build each feature

export interface User {
  id: string;
  email: string;
  name: string;
  monthly_income: number;
  dependents: number;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── Module 3 — Transactions ───────────────────────────────────────────

export type TransactionType = "expense";

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    type: BudgetType;
  };
}

export type BudgetType = "needs" | "wants" | "savings";

export interface BudgetCategory {
  id: string;
  user_id: string;
  name: string;
  type: BudgetType;
  budgeted_amount: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategoryWithActual extends BudgetCategory {
  actual_amount: number;
  remaining: number;
  is_over: boolean;
}

export interface BudgetSummary {
  month: string;
  total_income: number;
  categories: BudgetCategoryWithActual[];
  totals: {
    needs:   { budgeted: number; actual: number; target: number };
    wants:   { budgeted: number; actual: number; target: number };
    savings: { budgeted: number; actual: number; target: number };
  };
}