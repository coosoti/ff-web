"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useSavingsStore } from "../../lib/stores/savings.store";
import { SavingsGoal } from "../../types";

export default function SavingsPage() {
  return (
    <ProtectedRoute>
      <Savings />
    </ProtectedRoute>
  );
}

function progressColor(pct: number) {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 60)  return "bg-blue-500";
  if (pct >= 30)  return "bg-yellow-500";
  return "bg-red-500";
}

function daysLeft(targetDate: string | null) {
  if (!targetDate) return null;
  const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due today";
  return `${diff} days left`;
}

function Savings() {
  const { goals, loading, error, fetchGoals, createGoal, updateGoal, topUpGoal, deleteGoal, clearError } =
    useSavingsStore();

  const [showModal, setShowModal]     = useState(false);
  const [showTopUp, setShowTopUp]     = useState(false);
  const [editing, setEditing]         = useState<SavingsGoal | null>(null);
  const [topUpTarget, setTopUpTarget] = useState<SavingsGoal | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [form, setForm] = useState({
    name: "", target_amount: "", current_amount: "", target_date: "", notes: "",
  });

  useEffect(() => { fetchGoals(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", target_amount: "", current_amount: "", target_date: "", notes: "" });
    setShowModal(true);
  }

  function openEdit(goal: SavingsGoal) {
    setEditing(goal);
    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      target_date: goal.target_date ?? "",
      notes: goal.notes ?? "",
    });
    setShowModal(true);
  }

  function openTopUp(goal: SavingsGoal) {
    setTopUpTarget(goal);
    setTopUpAmount("");
    setShowTopUp(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.target_amount) return;
    if (editing) {
      await updateGoal(editing.id, {
        name: form.name,
        target_amount: Number(form.target_amount),
        current_amount: form.current_amount ? Number(form.current_amount) : undefined,
        target_date: form.target_date || undefined,
        notes: form.notes || undefined,
      });
    } else {
      await createGoal({
        name: form.name,
        target_amount: Number(form.target_amount),
        current_amount: form.current_amount ? Number(form.current_amount) : undefined,
        target_date: form.target_date || undefined,
        notes: form.notes || undefined,
      });
    }
    setShowModal(false);
  }

  async function handleTopUp() {
    if (!topUpTarget || !topUpAmount) return;
    await topUpGoal(topUpTarget.id, Number(topUpAmount));
    setShowTopUp(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this savings goal?")) return;
    await deleteGoal(id);
  }

  const active    = goals.filter((g) => !g.is_completed);
  const completed = goals.filter((g) => g.is_completed);
  const totalSaved  = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Savings Goals</h1>
            <p className="text-sm text-gray-400">{active.length} active · {completed.length} completed</p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm"
          >
            + New
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={clearError}>✕</button>
          </div>
        )}

        {/* Overall progress */}
        {goals.length > 0 && (
          <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 mb-6">
            <div className="flex justify-between mb-2">
              <p className="text-xs text-gray-400">Total saved</p>
              <p className="text-xs text-gray-400">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</p>
            </div>
            <div className="h-2 rounded-full bg-gray-800 mb-2">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
              />
            </div>
            <div className="flex justify-between">
              <p className="text-sm font-bold text-emerald-400">KES {totalSaved.toLocaleString()}</p>
              <p className="text-sm text-gray-500">of KES {totalTarget.toLocaleString()}</p>
            </div>
          </div>
        )}

        {loading && <p className="text-center text-gray-500 text-sm">Loading...</p>}

        {/* Active goals */}
        {active.length > 0 && (
          <div className="space-y-3 mb-6">
            {active.map((goal) => {
              const pct = Number(goal.target_amount) > 0
                ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)
                : 0;
              const days = daysLeft(goal.target_date);
              return (
                <div key={goal.id} className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{goal.name}</p>
                      {days && (
                        <p className={`text-xs mt-0.5 ${days === "Overdue" ? "text-red-400" : "text-gray-500"}`}>
                          {days}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-white">{Math.round(pct)}%</p>
                  </div>

                  <div className="h-2 rounded-full bg-gray-800 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${progressColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-emerald-400">
                        KES {Number(goal.current_amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        of KES {Number(goal.target_amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTopUp(goal)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30"
                      >
                        + Top up
                      </button>
                      <button
                        onClick={() => openEdit(goal)}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-xs hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-500 text-xs hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed goals */}
        {completed.length > 0 && (
          <>
            <p className="text-xs text-gray-500 mb-3">Completed</p>
            <div className="space-y-2">
              {completed.map((goal) => (
                <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-950 text-xs">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 line-through">{goal.name}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">
                    KES {Number(goal.target_amount).toLocaleString()}
                  </p>
                  <button onClick={() => handleDelete(goal.id)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && goals.length === 0 && (
          <p className="text-center text-gray-600 text-sm mt-12">No savings goals yet</p>
        )}

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">{editing ? "Edit Goal" : "New Savings Goal"}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Goal name (e.g. Emergency Fund)"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Target amount (KES)"
                  value={form.target_amount}
                  onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Already saved (KES) — optional"
                  value={form.current_amount}
                  onChange={(e) => setForm((f) => ({ ...f, current_amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="date"
                  placeholder="Target date — optional"
                  value={form.target_date}
                  onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Notes — optional"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.name || !form.target_amount}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm disabled:opacity-50"
                >
                  {editing ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Up Modal */}
        {showTopUp && topUpTarget && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-1">Top up</h3>
              <p className="text-sm text-gray-400 mb-4">{topUpTarget.name}</p>
              <input
                type="number"
                placeholder="Amount to add (KES)"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-emerald-500 mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowTopUp(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
                <button
                  onClick={handleTopUp}
                  disabled={loading || !topUpAmount}
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