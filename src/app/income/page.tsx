"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useIncomeStore } from "../../lib/stores/income.store";
import { IncomeEntry } from "../../types";

export default function IncomePage() {
  return (
    <ProtectedRoute>
      <Income />
    </ProtectedRoute>
  );
}

const COMMON_SOURCES = ["Salary", "Freelance", "Dividends", "Rent", "Business", "Other"];

function Income() {
  const { entries, total, loading, error, fetchIncome, createIncome, updateIncome, deleteIncome, clearError } =
    useIncomeStore();

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IncomeEntry | null>(null);
  const [form, setForm] = useState({ amount: "", source: "Salary", notes: "" });

  useEffect(() => {
    fetchIncome(month);
  }, [month]);

  function openAdd() {
    setEditing(null);
    setForm({ amount: "", source: "Salary", notes: "" });
    setShowModal(true);
  }

  function openEdit(entry: IncomeEntry) {
    setEditing(entry);
    setForm({ amount: String(entry.amount), source: entry.source, notes: entry.notes ?? "" });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.amount) return;
    if (editing) {
      await updateIncome(editing.id, {
        amount: Number(form.amount),
        source: form.source,
        notes: form.notes || undefined,
      });
    } else {
      await createIncome({
        amount: Number(form.amount),
        source: form.source,
        month,
        notes: form.notes || undefined,
      });
    }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this income entry?")) return;
    await deleteIncome(id);
  }

  const displayMonth = new Date(`${month}-01`).toLocaleDateString("en-KE", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Income</h1>
            <p className="text-sm text-gray-400">{displayMonth}</p>
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

        {/* Total income card */}
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <p className="text-xs text-gray-400 mb-1">Total income — {displayMonth}</p>
          <p className="text-3xl font-bold text-emerald-400">KES {total.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{entries.length} source{entries.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Add button */}
        <button
          onClick={openAdd}
          className="w-full py-3 mb-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors"
        >
          + Add Income
        </button>

        {/* Income entries */}
        {loading && <p className="text-center text-gray-500 text-sm">Loading...</p>}

        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
              {/* Source badge */}
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 text-xs font-bold">{entry.source.slice(0, 2).toUpperCase()}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{entry.source}</p>
                {entry.notes && <p className="text-xs text-gray-500 truncate">{entry.notes}</p>}
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">+{Number(entry.amount).toLocaleString()}</p>
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    onClick={() => openEdit(entry)}
                    className="text-xs text-gray-500 hover:text-emerald-400"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && entries.length === 0 && (
          <p className="text-center text-gray-600 text-sm mt-12">No income logged for {displayMonth}</p>
        )}

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">
                {editing ? "Edit Income" : "Add Income"}
              </h3>

              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Amount (KES)"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />

                {/* Source picker */}
                <div className="flex flex-wrap gap-2">
                  {COMMON_SOURCES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setForm((f) => ({ ...f, source: s }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                        ${form.source === s
                          ? "bg-emerald-500 text-gray-950"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Custom source */}
                {!COMMON_SOURCES.includes(form.source) && (
                  <input
                    type="text"
                    placeholder="Custom source"
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                )}

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
                  onClick={handleSubmit}
                  disabled={loading || !form.amount || !form.source}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm disabled:opacity-50"
                >
                  {editing ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}