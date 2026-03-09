"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useBillsStore } from "../../lib/stores/bills.store";
import { Bill, BillCategory, BillCycle } from "../../types";

export default function BillsPage() {
  return <ProtectedRoute><Bills /></ProtectedRoute>;
}

const CATEGORIES: BillCategory[] = ["rent", "utilities", "subscription", "insurance", "loan", "other"];
const CYCLES:     BillCycle[]     = ["weekly", "monthly", "quarterly", "annual"];

const CATEGORY_ICONS: Record<BillCategory, string> = {
  rent:         "🏠",
  utilities:    "💡",
  subscription: "📺",
  insurance:    "🛡️",
  loan:         "🏦",
  other:        "📋",
};

const CYCLE_LABELS: Record<BillCycle, string> = {
  weekly:    "Weekly",
  monthly:   "Monthly",
  quarterly: "Quarterly",
  annual:    "Annual",
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function dueBadge(bill: Bill) {
  if (bill.is_paid) return { label: "Paid ✓", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  const days = daysUntil(bill.next_due_date);
  if (days < 0)  return { label: "Overdue", cls: "bg-red-500/20 text-red-400 border-red-500/30" };
  if (days === 0) return { label: "Due today", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
  if (days <= 3) return { label: `Due in ${days}d`, cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  return { label: `Due in ${days}d`, cls: "bg-gray-700/50 text-gray-400 border-gray-700" };
}

type Tab = "all" | "unpaid" | "paid";

function Bills() {
  const {
    summary, history, loading, error,
    fetchSummary, createBill, updateBill, deleteBill,
    markPaid, markUnpaid, fetchHistory, clearError,
  } = useBillsStore();

  const [tab, setTab]             = useState<Tab>("all");
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [editing, setEditing]     = useState<Bill | null>(null);

  const [form, setForm] = useState({
    name: "", amount: "", category: "other" as BillCategory,
    cycle: "monthly" as BillCycle, due_day: "", notes: "",
  });

  useEffect(() => { fetchSummary(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", amount: "", category: "other", cycle: "monthly", due_day: "", notes: "" });
    setShowModal(true);
  }

  function openEdit(b: Bill) {
    setEditing(b);
    setForm({
      name: b.name, amount: String(b.amount), category: b.category,
      cycle: b.cycle, due_day: String(b.due_day), notes: b.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.amount || !form.due_day) return;
    const payload = {
      name:     form.name,
      amount:   Number(form.amount),
      category: form.category,
      cycle:    form.cycle,
      due_day:  Number(form.due_day),
      notes:    form.notes || undefined,
    };
    if (editing) await updateBill(editing.id, payload);
    else await createBill(payload);
    setShowModal(false);
  }

  async function togglePaid(b: Bill) {
    if (b.is_paid) await markUnpaid(b.id);
    else await markPaid(b.id);
  }

  async function openHistory(id: string) {
    await fetchHistory(id);
    setShowHistory(id);
  }

  const bills  = summary?.bills ?? [];
  const filtered = tab === "unpaid" ? bills.filter((b) => !b.is_paid)
                 : tab === "paid"   ? bills.filter((b) => b.is_paid)
                 : bills;

  const overdue = bills.filter((b) => !b.is_paid && daysUntil(b.next_due_date) < 0);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Bills</h1>
            <p className="text-sm text-gray-400">Recurring payments</p>
          </div>
          <button onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm">
            + Add
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm flex justify-between">
            <span>{error}</span><button onClick={clearError}>✕</button>
          </div>
        )}

        {/* Summary card */}
        {summary && (
          <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 mb-5">
            <p className="text-xs text-gray-400 mb-3">{summary.month} — This cycle</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500">Total Due</p>
                <p className="text-sm font-bold text-white">KES {summary.total_due.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-sm font-bold text-emerald-400">KES {summary.total_paid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unpaid</p>
                <p className={`text-sm font-bold ${summary.total_unpaid > 0 ? "text-red-400" : "text-gray-400"}`}>
                  KES {summary.total_unpaid.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-gray-800">
              <div className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${summary.total_due > 0 ? (summary.total_paid / summary.total_due) * 100 : 0}%` }} />
            </div>

            {overdue.length > 0 && (
              <p className="text-xs text-red-400 mt-2">⚠️ {overdue.length} overdue bill{overdue.length > 1 ? "s" : ""}</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-800 mb-4">
          {(["all", "unpaid", "paid"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors
                ${tab === t ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {t}
              {t === "unpaid" && summary && summary.total_unpaid > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
                  {bills.filter((b) => !b.is_paid).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-gray-500 text-sm py-8">Loading...</p>}

        {/* Bill list */}
        <div className="space-y-3">
          {filtered.map((b) => {
            const badge = dueBadge(b);
            return (
              <div key={b.id} className={`p-4 rounded-2xl border transition-all
                ${b.is_paid ? "bg-gray-900/50 border-gray-800/50 opacity-75" : "bg-gray-900 border-gray-800"}`}>
                <div className="flex items-start gap-3">
                  {/* Pay toggle */}
                  <button onClick={() => togglePaid(b)}
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                      ${b.is_paid ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-600 hover:border-emerald-500"}`}>
                    {b.is_paid && <span className="text-xs">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-semibold ${b.is_paid ? "line-through text-gray-500" : "text-white"}`}>
                        {CATEGORY_ICONS[b.category]} {b.name}
                      </p>
                      <p className="text-sm font-bold text-white">KES {Number(b.amount).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${badge.cls}`}>{badge.label}</span>
                        <span className="text-xs text-gray-600">{CYCLE_LABELS[b.cycle]}</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(b)} className="text-xs text-gray-600 hover:text-blue-400">edit</button>
                        <button onClick={() => openHistory(b.id)} className="text-xs text-gray-600 hover:text-gray-300">history</button>
                        <button onClick={() => { if (confirm("Delete this bill?")) deleteBill(b.id); }}
                          className="text-xs text-gray-600 hover:text-red-400">delete</button>
                      </div>
                    </div>

                    {b.notes && <p className="text-xs text-gray-600 mt-1 truncate">{b.notes}</p>}
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-gray-600 text-sm mt-10">
              {tab === "unpaid" ? "All bills paid ✓" : tab === "paid" ? "No paid bills yet" : "No bills added yet"}
            </p>
          )}
        </div>

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-6">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">
                {editing ? "Edit Bill" : "Add Bill"}
              </h3>
              <div className="space-y-3">
                <input type="text" placeholder="Bill name" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500" />

                {/* Category */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, category: c }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                        ${form.category === c ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      {CATEGORY_ICONS[c]} {c}
                    </button>
                  ))}
                </div>

                <input type="number" placeholder="Amount (KES)" value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500" />

                {/* Cycle */}
                <div className="flex gap-2">
                  {CYCLES.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, cycle: c }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors
                        ${form.cycle === c ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      {CYCLE_LABELS[c]}
                    </button>
                  ))}
                </div>

                <input type="number" placeholder="Due day (1–31)" value={form.due_day} min={1} max={31}
                  onChange={(e) => setForm((f) => ({ ...f, due_day: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500" />

                <input type="text" placeholder="Notes (optional)" value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm">Cancel</button>
                <button onClick={handleSubmit}
                  disabled={loading || !form.name || !form.amount || !form.due_day}
                  className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm disabled:opacity-50">
                  {editing ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-6">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Payment History</h3>
                <button onClick={() => setShowHistory(null)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              {(history[showHistory] ?? []).length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-4">No payment history yet</p>
              ) : (
                <div className="space-y-2">
                  {(history[showHistory] ?? []).map((p) => (
                    <div key={p.id} className="flex justify-between p-3 rounded-xl bg-gray-800">
                      <div>
                        <p className="text-xs text-gray-400">{p.cycle_key}</p>
                        {p.notes && <p className="text-xs text-gray-600">{p.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400">KES {Number(p.amount_paid).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{new Date(p.paid_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}