"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useInvestmentsStore } from "../../lib/stores/investments.store";
import { Investment, InvestmentType } from "../../types";

export default function InvestmentsPage() {
  return (
    <ProtectedRoute>
      <Investments />
    </ProtectedRoute>
  );
}

const TYPES: InvestmentType[] = ["stocks", "bonds", "mmf", "real_estate", "crypto", "other"];

const TYPE_ICONS: Record<InvestmentType, string> = {
  stocks:      "📈",
  bonds:       "🏛️",
  mmf:         "💰",
  real_estate: "🏘️",
  crypto:      "🪙",
  other:       "💼",
};

const TYPE_COLORS: Record<InvestmentType, string> = {
  stocks:      "bg-blue-500/20 border-blue-500/30 text-blue-400",
  bonds:       "bg-purple-500/20 border-purple-500/30 text-purple-400",
  mmf:         "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  real_estate: "bg-orange-500/20 border-orange-500/30 text-orange-400",
  crypto:      "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  other:       "bg-gray-500/20 border-gray-500/30 text-gray-400",
};

function gainColor(gain: number) {
  if (gain > 0) return "text-emerald-400";
  if (gain < 0) return "text-red-400";
  return "text-gray-400";
}

function Investments() {
  const { portfolio, loading, error, fetchPortfolio,
          createInvestment, updateInvestment, deleteInvestment, clearError } =
    useInvestmentsStore();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Investment | null>(null);
  const [form, setForm] = useState({
    name: "", type: "stocks" as InvestmentType,
    institution: "", units: "", purchase_price: "",
    current_price: "", total_invested: "", current_value: "",
    purchase_date: "", notes: "",
  });

  useEffect(() => { fetchPortfolio(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({
      name: "", type: "stocks", institution: "", units: "",
      purchase_price: "", current_price: "", total_invested: "",
      current_value: "", purchase_date: "", notes: "",
    });
    setShowModal(true);
  }

  function openEdit(inv: Investment) {
    setEditing(inv);
    setForm({
      name: inv.name,
      type: inv.type,
      institution: inv.institution ?? "",
      units: inv.units ? String(inv.units) : "",
      purchase_price: inv.purchase_price ? String(inv.purchase_price) : "",
      current_price: inv.current_price ? String(inv.current_price) : "",
      total_invested: String(inv.total_invested),
      current_value: String(inv.current_value),
      purchase_date: inv.purchase_date ?? "",
      notes: inv.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.total_invested || !form.current_value) return;
    const payload = {
      name:           form.name,
      type:           form.type,
      institution:    form.institution || undefined,
      units:          form.units ? Number(form.units) : undefined,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
      current_price:  form.current_price ? Number(form.current_price) : undefined,
      total_invested: Number(form.total_invested),
      current_value:  Number(form.current_value),
      purchase_date:  form.purchase_date || undefined,
      notes:          form.notes || undefined,
    };
    if (editing) await updateInvestment(editing.id, payload);
    else await createInvestment(payload);
    setShowModal(false);
  }

  const p = portfolio;
  const gainColor2 = p && p.total_gain_loss >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Investments</h1>
            <p className="text-sm text-gray-400">{p?.investments.length ?? 0} positions</p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold text-sm"
          >
            + Add
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={clearError}>✕</button>
          </div>
        )}

        {/* Portfolio summary card */}
        {p && (
          <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Invested</p>
                <p className="text-lg font-bold text-white">KES {p.total_invested.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Current Value</p>
                <p className="text-lg font-bold text-white">KES {p.total_current_value.toLocaleString()}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl ${p.total_gain_loss >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <span className="text-lg">{p.total_gain_loss >= 0 ? "📈" : "📉"}</span>
              <div>
                <p className="text-xs text-gray-400">Overall Gain / Loss</p>
                <p className={`text-sm font-bold ${gainColor2}`}>
                  {p.total_gain_loss >= 0 ? "+" : ""}KES {p.total_gain_loss.toLocaleString()}
                  <span className="ml-2 text-xs font-normal">
                    ({p.gain_loss_pct >= 0 ? "+" : ""}{p.gain_loss_pct}%)
                  </span>
                </p>
              </div>
            </div>

            {/* By type breakdown */}
            {Object.keys(p.by_type).length > 1 && (
              <div className="mt-4 space-y-1.5">
                {Object.entries(p.by_type).map(([type, stats]) => {
                  const pct = p.total_current_value > 0
                    ? Math.round((stats.current_value / p.total_current_value) * 100)
                    : 0;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-sm w-5">{TYPE_ICONS[type as InvestmentType]}</span>
                      <p className="text-xs text-gray-400 capitalize w-20">{type.replace("_", " ")}</p>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-800">
                        <div className="h-1.5 rounded-full bg-yellow-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 w-8 text-right">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {loading && <p className="text-center text-gray-500 text-sm">Loading...</p>}

        {/* Investment list */}
        <div className="space-y-3">
          {(p?.investments ?? []).map((inv) => {
            const gain = Number(inv.current_value) - Number(inv.total_invested);
            const gainPct = Number(inv.total_invested) > 0
              ? ((gain / Number(inv.total_invested)) * 100).toFixed(1)
              : "0";
            return (
              <div key={inv.id} className={`p-4 rounded-2xl border ${TYPE_COLORS[inv.type]}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{TYPE_ICONS[inv.type]}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{inv.name}</p>
                      {inv.institution && <p className="text-xs text-gray-500">{inv.institution}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(inv)} className="text-xs text-gray-500 hover:text-yellow-400">edit</button>
                    <button onClick={() => { if (confirm("Delete investment?")) deleteInvestment(inv.id); }}
                      className="text-xs text-gray-500 hover:text-red-400">delete</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Invested</p>
                    <p className="text-xs font-medium text-white">KES {Number(inv.total_invested).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Value</p>
                    <p className="text-xs font-medium text-white">KES {Number(inv.current_value).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gain/Loss</p>
                    <p className={`text-xs font-bold ${gainColor(gain)}`}>
                      {gain >= 0 ? "+" : ""}KES {gain.toLocaleString()} ({gainPct}%)
                    </p>
                  </div>
                </div>

                {inv.units && inv.current_price && (
                  <p className="text-xs text-gray-600 mt-2">
                    {inv.units} units @ KES {Number(inv.current_price).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {!loading && (p?.investments ?? []).length === 0 && (
          <p className="text-center text-gray-600 text-sm mt-12">No investments yet</p>
        )}

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-6 overflow-y-auto">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800 my-4">
              <h3 className="text-lg font-bold text-white mb-4">
                {editing ? "Edit Investment" : "Add Investment"}
              </h3>

              <div className="space-y-3">
                <input type="text" placeholder="Name (e.g. Safaricom PLC)" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />

                {/* Type picker */}
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                        ${form.type === t ? "bg-yellow-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      {TYPE_ICONS[t]} {t.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <input type="text" placeholder="Institution (optional)" value={form.institution}
                  onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />

                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Total invested (KES)" value={form.total_invested}
                    onChange={(e) => setForm((f) => ({ ...f, total_invested: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
                  <input type="number" placeholder="Current value (KES)" value={form.current_value}
                    onChange={(e) => setForm((f) => ({ ...f, current_value: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Units (optional)" value={form.units}
                    onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
                  <input type="number" placeholder="Current price" value={form.current_price}
                    onChange={(e) => setForm((f) => ({ ...f, current_price: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
                </div>

                <input type="date" placeholder="Purchase date (optional)" value={form.purchase_date}
                  onChange={(e) => setForm((f) => ({ ...f, purchase_date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />

                <input type="text" placeholder="Notes (optional)" value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">
                  Cancel
                </button>
                <button onClick={handleSubmit}
                  disabled={loading || !form.name || !form.total_invested || !form.current_value}
                  className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold text-sm disabled:opacity-50">
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