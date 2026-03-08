"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useTransactionsStore } from "../../lib/stores/transactions.store";
import { useBudgetStore } from "../../lib/stores/budget.store";
import { useAuthStore } from "../../lib/stores/auth.store";
import { Transaction, TransactionType, BudgetType } from "../../types";

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <Transactions />
    </ProtectedRoute>
  );
}

const TYPE_COLORS: Record<BudgetType, string> = {
  needs:   "bg-blue-500",
  wants:   "bg-purple-500",
  savings: "bg-emerald-500",
};

function Transactions() {
  const { user } = useAuthStore();
  const { transactions, loading, error, fetchTransactions,
          createTransaction, deleteTransaction, clearError,
          addFromSocket, updateFromSocket, removeFromSocket } = useTransactionsStore();
  const { categories, fetchCategories } = useBudgetStore();

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    type: "expense" as TransactionType,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Socket.io — real-time updates (US-009)
  useEffect(() => {
    if (!user) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const socket: Socket = io(apiUrl);
    socket.emit("join", user.id);
    socket.on("transaction:created", addFromSocket);
    socket.on("transaction:updated", updateFromSocket);
    socket.on("transaction:deleted", ({ id }: { id: string }) => removeFromSocket(id));
    return () => { socket.disconnect(); };
  }, [user]);

  useEffect(() => {
    fetchTransactions(month);
  }, [month]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleCreate() {
    if (!form.amount) return;
    await createTransaction({
      category_id: form.category_id || undefined,
      amount: Number(form.amount),
      type: form.type,
      date: form.date,
      notes: form.notes || undefined,
    });
    setForm({ category_id: "", amount: "", type: "expense", date: new Date().toISOString().split("T")[0], notes: "" });
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
  }

  // Deduplicate by id before grouping
  const unique = transactions.filter((tx, i, arr) => arr.findIndex((t) => t.id === tx.id) === i);

  // Group by date
  const grouped = unique.reduce((acc, tx) => {
    const key = tx.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const totalExpense = unique.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Transactions</h1>
            <p className="text-sm text-gray-400">{unique.length} this month</p>
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
            <button onClick={clearError}>✕</button>
          </div>
        )}

        {/* Total expenses summary */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
          <p className="text-xs text-gray-400 mb-1">Total expenses this month</p>
          <p className="text-2xl font-bold text-red-400">KES {totalExpense.toLocaleString()}</p>
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 mb-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors"
        >
          + Add Transaction
        </button>

        {/* Transaction list grouped by date */}
        {loading && <p className="text-center text-gray-500 text-sm">Loading...</p>}

        {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map((date) => (
          <div key={date} className="mb-4">
            <p className="text-xs text-gray-500 mb-2">
              {new Date(date).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            <div className="space-y-2">
              {grouped[date].map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <div className={`w-2 h-8 rounded-full ${tx.category ? TYPE_COLORS[tx.category.type] : "bg-gray-600"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {tx.category?.name ?? "Uncategorised"}
                    </p>
                    {tx.notes && <p className="text-xs text-gray-500 truncate">{tx.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">
                      -{Number(tx.amount).toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-xs text-gray-600 hover:text-red-400 mt-0.5"
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!loading && unique.length === 0 && (
          <p className="text-center text-gray-600 text-sm mt-12">No transactions this month</p>
        )}

        {/* Add Transaction Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">New Transaction</h3>

              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Amount (KES)"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />

                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />

                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || !form.amount}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}