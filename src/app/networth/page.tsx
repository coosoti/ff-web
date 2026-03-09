"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useNetworthStore } from "../../lib/stores/networth.store";
import { Asset, AssetCategory, Liability, LiabilityCategory } from "../../types";

export default function NetWorthPage() {
  return (
    <ProtectedRoute>
      <NetWorth />
    </ProtectedRoute>
  );
}

const ASSET_CATEGORIES: AssetCategory[]     = ["property", "vehicle", "investment", "other"];
const LIABILITY_CATEGORIES: LiabilityCategory[] = ["loan", "mortgage", "credit_card", "other"];

const CATEGORY_ICONS: Record<string, string> = {
  property: "🏠", vehicle: "🚗", investment: "📈", other: "💼",
  loan: "🏦", mortgage: "🏛️", credit_card: "💳",
};

type ModalMode = "asset" | "liability";

function NetWorth() {
  const { summary, loading, error, fetchSummary,
          createAsset, updateAsset, deleteAsset,
          createLiability, updateLiability, deleteLiability,
          clearError } = useNetworthStore();

  const [tab, setTab]           = useState<"overview" | "assets" | "liabilities">("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("asset");
  const [editingAsset, setEditingAsset]         = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  const [assetForm, setAssetForm] = useState({
    name: "", category: "other" as AssetCategory, value: "", notes: "",
  });
  const [liabForm, setLiabForm] = useState({
    name: "", category: "other" as LiabilityCategory, balance: "", interest_rate: "", notes: "",
  });

  useEffect(() => { fetchSummary(); }, []);

  function openAddAsset() {
    setEditingAsset(null);
    setAssetForm({ name: "", category: "other", value: "", notes: "" });
    setModalMode("asset");
    setShowModal(true);
  }

  function openEditAsset(a: Asset) {
    setEditingAsset(a);
    setAssetForm({ name: a.name, category: a.category, value: String(a.value), notes: a.notes ?? "" });
    setModalMode("asset");
    setShowModal(true);
  }

  function openAddLiability() {
    setEditingLiability(null);
    setLiabForm({ name: "", category: "other", balance: "", interest_rate: "", notes: "" });
    setModalMode("liability");
    setShowModal(true);
  }

  function openEditLiability(l: Liability) {
    setEditingLiability(l);
    setLiabForm({
      name: l.name, category: l.category,
      balance: String(l.balance),
      interest_rate: l.interest_rate ? String(l.interest_rate) : "",
      notes: l.notes ?? "",
    });
    setModalMode("liability");
    setShowModal(true);
  }

  async function handleAssetSubmit() {
    if (!assetForm.name || !assetForm.value) return;
    const payload = {
      name: assetForm.name,
      category: assetForm.category,
      value: Number(assetForm.value),
      notes: assetForm.notes || undefined,
    };
    if (editingAsset) await updateAsset(editingAsset.id, payload);
    else await createAsset(payload);
    setShowModal(false);
  }

  async function handleLiabSubmit() {
    if (!liabForm.name || !liabForm.balance) return;
    const payload = {
      name: liabForm.name,
      category: liabForm.category,
      balance: Number(liabForm.balance),
      interest_rate: liabForm.interest_rate ? Number(liabForm.interest_rate) : undefined,
      notes: liabForm.notes || undefined,
    };
    if (editingLiability) await updateLiability(editingLiability.id, payload);
    else await createLiability(payload);
    setShowModal(false);
  }

  const nw = summary?.net_worth ?? 0;
  const nwColor = nw >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <h1 className="text-xl font-bold text-white mb-1">Net Worth</h1>
        <p className="text-sm text-gray-400 mb-6">Assets − Liabilities</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={clearError}>✕</button>
          </div>
        )}

        {/* Net worth card */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 mb-6">
          <p className="text-xs text-gray-400 mb-1">Total Net Worth</p>
          <p className={`text-4xl font-bold mb-4 ${nwColor}`}>
            KES {Math.abs(nw).toLocaleString()}
            {nw < 0 && <span className="text-lg ml-1 text-red-400">(negative)</span>}
          </p>

          {/* Breakdown bar */}
          {summary && (
            <div className="space-y-2">
              {[
                { label: "Cash",        value: summary.breakdown.cash,        color: "bg-blue-500" },
                { label: "Savings",     value: summary.breakdown.savings,     color: "bg-emerald-500" },
                { label: "Investments", value: summary.breakdown.investments, color: "bg-yellow-500" },
                { label: "Pension",     value: summary.breakdown.pension,     color: "bg-indigo-500" },
                { label: "Assets",      value: summary.breakdown.assets,      color: "bg-purple-500" },
                { label: "Liabilities", value: -summary.total_liabilities,    color: "bg-red-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                  <p className="text-xs text-gray-400 w-20">{label}</p>
                  <p className={`text-xs font-medium ml-auto ${value < 0 ? "text-red-400" : "text-white"}`}>
                    {value < 0 ? "-" : "+"}KES {Math.abs(value).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-800 mb-6">
          {(["overview", "assets", "liabilities"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors
                ${tab === t ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-gray-500 text-sm">Loading...</p>}

        {/* Overview tab */}
        {tab === "overview" && summary && (
          <div className="space-y-3">
            {/* Auto: cash */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-400">💵 Cash Balance</p>
                  <p className="text-xs text-gray-600 mt-0.5">Income − Expenses (all time)</p>
                </div>
                <p className="text-sm font-bold text-blue-400">+KES {summary.breakdown.cash.toLocaleString()}</p>
              </div>
            </div>

            {/* Auto: savings */}
            {summary.savings_goals.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-gray-400">🏦 Savings Goals</p>
                  <p className="text-sm font-bold text-emerald-400">+KES {summary.breakdown.savings.toLocaleString()}</p>
                </div>
                {summary.savings_goals.map((g) => (
                  <div key={g.id} className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">{g.name}</p>
                    <p className="text-xs text-gray-400">KES {Number(g.current_amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Auto: investments */}
            {summary.investments.length > 0 && (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-gray-400">📈 Investments</p>
                  <p className="text-sm font-bold text-yellow-400">+KES {summary.breakdown.investments.toLocaleString()}</p>
                </div>
                {summary.investments.map((i) => {
                  const gain = Number(i.current_value) - Number(i.total_invested);
                  return (
                    <div key={i.id} className="flex justify-between mt-1">
                      <p className="text-xs text-gray-500">{i.name}</p>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">KES {Number(i.current_value).toLocaleString()}</p>
                        {gain !== 0 && (
                          <p className={`text-xs ${gain > 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {gain > 0 ? "+" : ""}KES {gain.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Auto: pension */}
            {summary.pension.length > 0 && (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-gray-400">🏦 Pension</p>
                  <p className="text-sm font-bold text-indigo-400">+KES {summary.breakdown.pension.toLocaleString()}</p>
                </div>
                {summary.pension.map((p) => (
                  <div key={p.id} className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">{p.provider} — {p.scheme_name}</p>
                    <p className="text-xs text-gray-400">KES {Number(p.total_value).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Manual: assets */}
            {summary.assets.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-gray-400">📦 Assets</p>
                  <p className="text-sm font-bold text-purple-400">+KES {summary.breakdown.assets.toLocaleString()}</p>
                </div>
                {summary.assets.map((a) => (
                  <div key={a.id} className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">{CATEGORY_ICONS[a.category]} {a.name}</p>
                    <p className="text-xs text-gray-400">KES {Number(a.value).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Manual: liabilities */}
            {summary.liabilities.length > 0 && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-gray-400">💸 Liabilities</p>
                  <p className="text-sm font-bold text-red-400">-KES {summary.total_liabilities.toLocaleString()}</p>
                </div>
                {summary.liabilities.map((l) => (
                  <div key={l.id} className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">{CATEGORY_ICONS[l.category]} {l.name}</p>
                    <p className="text-xs text-gray-400">KES {Number(l.balance).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assets tab */}
        {tab === "assets" && (
          <>
            <button
              onClick={openAddAsset}
              className="w-full py-3 mb-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-colors"
            >
              + Add Asset
            </button>
            <div className="space-y-3">
              {(summary?.assets ?? []).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
                  <span className="text-2xl">{CATEGORY_ICONS[a.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{a.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{a.category}</p>
                    {a.notes && <p className="text-xs text-gray-600 truncate">{a.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-purple-400">KES {Number(a.value).toLocaleString()}</p>
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => openEditAsset(a)} className="text-xs text-gray-500 hover:text-purple-400">edit</button>
                      <button onClick={() => { if (confirm("Delete asset?")) deleteAsset(a.id); }} className="text-xs text-gray-500 hover:text-red-400">delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {(summary?.assets ?? []).length === 0 && !loading && (
                <p className="text-center text-gray-600 text-sm mt-8">No assets added yet</p>
              )}
            </div>
          </>
        )}

        {/* Liabilities tab */}
        {tab === "liabilities" && (
          <>
            <button
              onClick={openAddLiability}
              className="w-full py-3 mb-4 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-colors"
            >
              + Add Liability
            </button>
            <div className="space-y-3">
              {(summary?.liabilities ?? []).map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
                  <span className="text-2xl">{CATEGORY_ICONS[l.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{l.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{l.category.replace("_", " ")}</p>
                    {l.interest_rate && <p className="text-xs text-gray-600">{l.interest_rate}% p.a.</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">KES {Number(l.balance).toLocaleString()}</p>
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => openEditLiability(l)} className="text-xs text-gray-500 hover:text-red-400">edit</button>
                      <button onClick={() => { if (confirm("Delete liability?")) deleteLiability(l.id); }} className="text-xs text-gray-500 hover:text-red-400">delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {(summary?.liabilities ?? []).length === 0 && !loading && (
                <p className="text-center text-gray-600 text-sm mt-8">No liabilities added yet</p>
              )}
            </div>
          </>
        )}

        {/* Asset Modal */}
        {showModal && modalMode === "asset" && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">{editingAsset ? "Edit Asset" : "Add Asset"}</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Asset name" value={assetForm.name}
                  onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-purple-500" />
                <div className="flex flex-wrap gap-2">
                  {ASSET_CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setAssetForm((f) => ({ ...f, category: c }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                        ${assetForm.category === c ? "bg-purple-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      {CATEGORY_ICONS[c]} {c}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Value (KES)" value={assetForm.value}
                  onChange={(e) => setAssetForm((f) => ({ ...f, value: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-purple-500" />
                <input type="text" placeholder="Notes (optional)" value={assetForm.notes}
                  onChange={(e) => setAssetForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm">Cancel</button>
                <button onClick={handleAssetSubmit} disabled={loading || !assetForm.name || !assetForm.value}
                  className="flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm disabled:opacity-50">
                  {editingAsset ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liability Modal */}
        {showModal && modalMode === "liability" && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">{editingLiability ? "Edit Liability" : "Add Liability"}</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Liability name" value={liabForm.name}
                  onChange={(e) => setLiabForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
                <div className="flex flex-wrap gap-2">
                  {LIABILITY_CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setLiabForm((f) => ({ ...f, category: c }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                        ${liabForm.category === c ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      {CATEGORY_ICONS[c]} {c.replace("_", " ")}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Balance (KES)" value={liabForm.balance}
                  onChange={(e) => setLiabForm((f) => ({ ...f, balance: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
                <input type="number" placeholder="Interest rate % p.a. (optional)" value={liabForm.interest_rate}
                  onChange={(e) => setLiabForm((f) => ({ ...f, interest_rate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
                <input type="text" placeholder="Notes (optional)" value={liabForm.notes}
                  onChange={(e) => setLiabForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm">Cancel</button>
                <button onClick={handleLiabSubmit} disabled={loading || !liabForm.name || !liabForm.balance}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm disabled:opacity-50">
                  {editingLiability ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}