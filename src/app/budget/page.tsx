"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useBudgetStore } from "../../lib/stores/budget.store";
import { useAuthStore } from "../../lib/stores/auth.store";
import { BudgetType, BudgetCategoryWithActual } from "../../types";

export default function BudgetPage() {
  return (
    <ProtectedRoute>
      <Budget />
    </ProtectedRoute>
  );
}

function Budget() {
  const { user } = useAuthStore();
  const { categories, summary, loading, error, fetchCategories, fetchSummary,
          createCategory, updateCategory, deleteCategory, recalculate, clearError } = useBudgetStore();

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState("");

  // New category form state
  const [form, setForm] = useState({ name: "", type: "wants" as BudgetType, budgeted_amount: "" });

  useEffect(() => {
    fetchCategories();
    fetchSummary(month);
  }, [month]);

  async function handleCreate() {
    if (!form.name || !form.budgeted_amount) return;
    await createCategory(form.name, form.type, Number(form.budgeted_amount));
    setForm({ name: "", type: "wants", budgeted_amount: "" });
    setShowAddModal(false);
    fetchSummary(month);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    await deleteCategory(id);
    fetchSummary(month);
  }

  async function handleRecalculate() {
    if (!newIncome || Number(newIncome) <= 0) return;
    await recalculate(Number(newIncome));
    setNewIncome("");
    fetchSummary(month);
  }

  const TYPE_COLORS: Record<BudgetType, string> = {
    needs:   "bg-blue-500",
    wants:   "bg-purple-500",
    savings: "bg-emerald-500",
  };

  const TYPE_BG: Record<BudgetType, string> = {
    needs:   "bg-blue-500/10 border-blue-500/20",
    wants:   "bg-purple-500/10 border-purple-500/20",
    savings: "bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Budget</h1>
            <p className="text-sm text-gray-400">50 / 30 / 20 rule</p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400">✕</button>
          </div>
        )}

        {/* 50/30/20 Summary Cards */}
        {summary && (
          <>
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 mb-3 flex justify-between items-center">
              <p className="text-xs text-gray-400">Total income this month</p>
              <p className="text-sm font-bold text-emerald-400">KES {summary.total_income.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(["needs", "wants", "savings"] as BudgetType[]).map((type) => {
                const t = summary.totals[type];
                const pct = t.target > 0 ? Math.min((t.actual / t.target) * 100, 100) : 0;
                return (
                  <div key={type} className={`p-3 rounded-xl border ${TYPE_BG[type]}`}>
                    <p className="text-xs text-gray-400 capitalize mb-1">{type}</p>
                    <p className="text-sm font-bold text-white">{Math.round(pct)}%</p>
                    <div className="mt-2 h-1 rounded-full bg-gray-800">
                      <div className={`h-1 rounded-full ${TYPE_COLORS[type]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.actual.toLocaleString()} / {t.target.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Recalculate income */}
        <div className="flex gap-2 mb-6">
          <input
            type="number"
            value={newIncome}
            onChange={(e) => setNewIncome(e.target.value)}
            placeholder="New monthly income (KES)"
            className="flex-1 px-3 py-2 text-sm bg-gray-900 border border-gray-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 placeholder-gray-600"
          />
          <button
            onClick={handleRecalculate}
            disabled={loading || !newIncome}
            className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            Recalc
          </button>
        </div>

        {/* Category List */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300">Categories</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {(summary?.categories ?? categories as any[]).map((cat: BudgetCategoryWithActual) => {
            const actual = cat.actual_amount ?? 0;
            const budgeted = Number(cat.budgeted_amount);
            const pct = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0;
            const isOver = actual > budgeted;
            const isEditing = editingId === cat.id;

            return (
              <div key={cat.id} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[cat.type as BudgetType]}`} />
                    <span className="text-sm text-white font-medium">{cat.name}</span>
                    {!cat.is_default && (
                      <span className="text-xs text-gray-600 border border-gray-700 rounded px-1">custom</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver && <span className="text-xs text-red-400">over</span>}
                    {!cat.is_default && (
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-xs text-gray-600 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-1.5 rounded-full bg-gray-800 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${isOver ? "bg-red-500" : TYPE_COLORS[cat.type as BudgetType]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Spent: KES {actual.toLocaleString()}</span>
                  <span>Budget: KES {budgeted.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">New Category</h3>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Category name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />

                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BudgetType }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="needs">Needs</option>
                  <option value="wants">Wants</option>
                  <option value="savings">Savings</option>
                </select>

                <input
                  type="number"
                  placeholder="Monthly budget (KES)"
                  value={form.budgeted_amount}
                  onChange={(e) => setForm((f) => ({ ...f, budgeted_amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm disabled:opacity-50"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}