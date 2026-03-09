// types/index.ts
// ── Module 1 — Authentication ─────────────────────────────────────────

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

// ── Module 8 — Analytics ─────────────────────────────────────────────

export interface TrendPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface IncomeExpenseTrend {
  trend: TrendPoint[];
  totalIncome: number;
  totalExpenses: number;
  avgSavings: number;
}

export interface SpendingCategory {
  id: string;
  name: string;
  type: string;
  total: number;
  count: number;
  pct: number;
}

export interface SpendingBreakdown {
  categories: SpendingCategory[];
  grandTotal: number;
}

export interface BudgetPerformanceItem {
  id: string;
  name: string;
  type: string;
  budgeted: number;
  actual: number;
  variance: number;
  is_over: boolean;
}

export interface BudgetPerformance {
  performance: BudgetPerformanceItem[];
  summary: {
    total_budgeted: number;
    total_actual: number;
    total_variance: number;
    avg_monthly_income: number;
    months: number;
  };
}

export interface SavingsGoalProgress {
  id: string;
  name: string;
  target: number;
  current: number;
  remaining: number;
  pct: number;
  is_completed: boolean;
  target_date: string | null;
  months_left: number | null;
}

export interface SavingsProgress {
  goals: SavingsGoalProgress[];
  summary: {
    total_target: number;
    total_current: number;
    overall_pct: number;
    completed: number;
    active: number;
  };
}

export interface NetworthSnapshot {
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  cash_trend: TrendPoint[];
}

export interface FullReport {
  incomeExpense: IncomeExpenseTrend;
  spending: SpendingBreakdown;
  budget: BudgetPerformance;
  savings: SavingsProgress;
  networth: NetworthSnapshot;
  generated_at: string;
  months: number;
}

// ── Module 7 — Pension ────────────────────────────────────────────────

export interface PensionAccount {
  id: string;
  user_id: string;
  provider: string;
  scheme_name: string;
  total_value: number;
  retirement_age: number;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PensionFund {
  id: string;
  account_id: string;
  user_id: string;
  name: string;
  allocation_pct: number;
  current_value: number;
  created_at: string;
  updated_at: string;
}

export interface PensionWithdrawal {
  id: string;
  account_id: string;
  user_id: string;
  amount: number;
  reason: string | null;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface PensionProjection {
  account_id: string;
  current_value: number;
  years_to_retirement: number;
  retirement_age: number;
  projections: {
    conservative: { rate: number; value: number };
    moderate:     { rate: number; value: number };
    aggressive:   { rate: number; value: number };
  };
}

// ── Module 6 — Investments ────────────────────────────────────────────

export type InvestmentType = "stocks" | "bonds" | "mmf" | "real_estate" | "crypto" | "other";

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: InvestmentType;
  institution: string | null;
  units: number | null;
  purchase_price: number | null;
  current_price: number | null;
  total_invested: number;
  current_value: number;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSummary {
  total_invested: number;
  total_current_value: number;
  total_gain_loss: number;
  gain_loss_pct: number;
  by_type: Record<string, { total_invested: number; current_value: number; count: number }>;
  investments: Investment[];
}

// ── Module 5 — Net Worth ──────────────────────────────────────────────

export type AssetCategory     = "property" | "vehicle" | "investment" | "other";
export type LiabilityCategory = "loan" | "mortgage" | "credit_card" | "other";

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: AssetCategory;
  value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  category: LiabilityCategory;
  balance: number;
  interest_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSummary {
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  breakdown: {
    cash: number;
    savings: number;
    assets: number;
    investments: number;
    pension: number;
  };
  assets: Asset[];
  liabilities: Liability[];
  savings_goals: { id: string; name: string; current_amount: number }[];
  investments: { id: string; name: string; type: string; current_value: number; total_invested: number }[];
  pension: { id: string; provider: string; scheme_name: string; total_value: number }[];
}

// ── Module 4 — Savings Goals ──────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ── Income ────────────────────────────────────────────────────────────

export interface IncomeEntry {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  month: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeMonth {
  entries: IncomeEntry[];
  total: number;
  month: string;
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