"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { usePensionStore } from "../../lib/stores/pension.store";
import { PensionAccount, PensionFund, PensionWithdrawal } from "../../types";

export default function PensionPage() {
  return (
    <ProtectedRoute>
      <Pension />
    </ProtectedRoute>
  );
}

type Tab = "overview" | "funds" | "withdrawals" | "projection";

function Pension() {
  const {
    accounts, funds, withdrawals, projections, loading, error,
    fetchAccounts, createAccount, updateAccount, deleteAccount,
    fetchFunds, upsertFunds,
    fetchWithdrawals, createWithdrawal, deleteWithdrawal,
    fetchProjection, clearError,
  } = usePensionStore();

  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [tab, setTab]                   = useState<Tab>("overview");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PensionAccount | null>(null);

  const [accountForm, setAccountForm] = useState({
    provider: "", scheme_name: "", total_value: "",
    retirement_age: "60", date_of_birth: "", notes: "",
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "", reason: "", date: new Date().toISOString().split("T")[0], notes: "",
  });

  // Fund editor rows
  const [fundRows, setFundRows] = useState<{ name: string; allocation_pct: string; current_value: string }[]>([
    { name: "", allocation_pct: "", current_value: "" },
  ]);

  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!selectedId && accounts.length > 0) setSelectedId(accounts[0].id);
  }, [accounts]);

  useEffect(() => {
    if (!selectedId) return;
    if (tab === "funds")       fetchFunds(selectedId);
    if (tab === "withdrawals") fetchWithdrawals(selectedId);
    if (tab === "projection")  fetchProjection(selectedId);
  }, [selectedId, tab]);

  function openAddAccount() {
    setEditingAccount(null);
    setAccountForm({ provider: "", scheme_name: "", total_value: "", retirement_age: "60", date_of_birth: "", notes: "" });
    setShowAccountModal(true);
  }

  function openEditAccount(a: PensionAccount) {
    setEditingAccount(a);
    setAccountForm({
      provider: a.provider, scheme_name: a.scheme_name,
      total_value: String(a.total_value), retirement_age: String(a.retirement_age),
      date_of_birth: a.date_of_birth ?? "", notes: a.notes ?? "",
    });
    setShowAccountModal(true);
  }

  async function handleAccountSubmit() {
    if (!accountForm.provider || !accountForm.scheme_name || !accountForm.total_value) return;
    const payload = {
      provider:       accountForm.provider,
      scheme_name:    accountForm.scheme_name,
      total_value:    Number(accountForm.total_value),
      retirement_age: Number(accountForm.retirement_age),
      date_of_birth:  accountForm.date_of_birth || undefined,
      notes:          accountForm.notes || undefined,
    };
    if (editingAccount) await updateAccount(editingAccount.id, payload);
    else await createAccount(payload);
    setShowAccountModal(false);
  }

  function openFundsModal() {
    const existing = selectedId ? (funds[selectedId] ?? []) : [];
    if (existing.length > 0) {
      setFundRows(existing.map((f) => ({
        name: f.name,
        allocation_pct: String(f.allocation_pct),
        current_value: String(f.current_value),
      })));
    } else {
      setFundRows([{ name: "", allocation_pct: "", current_value: "" }]);
    }
    setShowFundsModal(true);
  }

  async function handleFundsSubmit() {
    if (!selectedId) return;
    const parsed = fundRows
      .filter((r) => r.name && r.allocation_pct && r.current_value)
      .map((r) => ({
        name:           r.name,
        allocation_pct: Number(r.allocation_pct),
        current_value:  Number(r.current_value),
      }));
    await upsertFunds(selectedId, parsed);
    setShowFundsModal(false);
  }

  async function handleWithdrawalSubmit() {
    if (!selectedId || !withdrawalForm.amount) return;
    await createWithdrawal(selectedId, {
      amount: Number(withdrawalForm.amount),
      reason: withdrawalForm.reason || undefined,
      date:   withdrawalForm.date,
      notes:  withdrawalForm.notes || undefined,
    });
    setWithdrawalForm({ amount: "", reason: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setShowWithdrawalModal(false);
  }

  const projection = selectedId ? projections[selectedId] : null;
  const accountFunds = selectedId ? (funds[selectedId] ?? []) : [];
  const accountWithdrawals = selectedId ? (withdrawals[selectedId] ?? []) : [];
  const totalAllocation = fundRows.reduce((s, r) => s + (Number(r.allocation_pct) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Pension</h1>
            <p className="text-sm text-gray-400">IPP accounts</p>
          </div>
          <button onClick={openAddAccount}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm">
            + Add
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm flex justify-between">
            <span>{error}</span><button onClick={clearError}>✕</button>
          </div>
        )}

        {/* Account selector */}
        {accounts.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {accounts.map((a) => (
              <button key={a.id} onClick={() => { setSelectedId(a.id); setTab("overview"); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-colors
                  ${selectedId === a.id ? "bg-indigo-500 text-white" : "bg-gray-900 border border-gray-800 text-gray-400"}`}>
                {a.provider}
              </button>
            ))}
          </div>
        )}

        {/* Selected account card */}
        {selected && (
          <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-400">{selected.provider}</p>
                <p className="text-sm font-semibold text-white">{selected.scheme_name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditAccount(selected)} className="text-xs text-gray-500 hover:text-indigo-400">edit</button>
                <button onClick={() => { if (confirm("Delete this account?")) deleteAccount(selected.id); }}
                  className="text-xs text-gray-500 hover:text-red-400">delete</button>
              </div>
            </div>
            <p className="text-3xl font-bold text-indigo-400 mb-1">
              KES {Number(selected.total_value).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              Retirement age: {selected.retirement_age}
              {selected.date_of_birth && ` · Born ${selected.date_of_birth}`}
            </p>
          </div>
        )}

        {accounts.length === 0 && !loading && (
          <p className="text-center text-gray-600 text-sm mt-12">No pension accounts yet</p>
        )}

        {/* Tabs */}
        {selected && (
          <>
            <div className="flex rounded-xl overflow-hidden border border-gray-800 mb-4">
              {(["overview", "funds", "withdrawals", "projection"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-xs font-medium capitalize transition-colors
                    ${tab === t ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* ── Overview ── */}
            {tab === "overview" && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                  <p className="text-xs text-gray-400 mb-3">Quick Stats</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Current Value</p>
                      <p className="text-sm font-bold text-white">KES {Number(selected.total_value).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Retirement Age</p>
                      <p className="text-sm font-bold text-white">{selected.retirement_age} yrs</p>
                    </div>
                  </div>
                </div>
                {selected.notes && (
                  <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-300">{selected.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Funds ── */}
            {tab === "funds" && (
              <>
                <button onClick={openFundsModal}
                  className="w-full py-3 mb-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm">
                  {accountFunds.length > 0 ? "Edit Allocations" : "Set Fund Allocations"}
                </button>
                {accountFunds.length > 0 ? (
                  <div className="space-y-3">
                    {accountFunds.map((f) => (
                      <div key={f.id} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-semibold text-white">{f.name}</p>
                          <p className="text-sm font-bold text-indigo-400">{f.allocation_pct}%</p>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 mb-2">
                          <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${f.allocation_pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400">KES {Number(f.current_value).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 text-sm mt-8">No fund allocations set</p>
                )}
              </>
            )}

            {/* ── Withdrawals ── */}
            {tab === "withdrawals" && (
              <>
                <button onClick={() => setShowWithdrawalModal(true)}
                  className="w-full py-3 mb-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/30">
                  + Log Withdrawal
                </button>
                <div className="space-y-3">
                  {accountWithdrawals.map((w) => (
                    <div key={w.id} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-semibold text-red-400">-KES {Number(w.amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{w.date}</p>
                      </div>
                      {w.reason && <p className="text-xs text-gray-400">{w.reason}</p>}
                      {w.notes  && <p className="text-xs text-gray-600 mt-1">{w.notes}</p>}
                      <button onClick={() => { if (confirm("Delete withdrawal? Amount will be restored.")) deleteWithdrawal(selected.id, w.id); }}
                        className="text-xs text-gray-600 hover:text-red-400 mt-2">delete</button>
                    </div>
                  ))}
                  {accountWithdrawals.length === 0 && (
                    <p className="text-center text-gray-600 text-sm mt-8">No withdrawals recorded</p>
                  )}
                </div>
              </>
            )}

            {/* ── Projection ── */}
            {tab === "projection" && (
              <div className="space-y-3">
                {projection ? (
                  <>
                    <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                      <p className="text-xs text-gray-400 mb-1">Years to Retirement</p>
                      <p className="text-2xl font-bold text-white">{projection.years_to_retirement} years</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Current value: KES {projection.current_value.toLocaleString()}
                      </p>
                    </div>
                    {[
                      { key: "conservative", label: "Conservative", rate: 6,  color: "border-blue-500/30 bg-blue-500/10",    text: "text-blue-400" },
                      { key: "moderate",     label: "Moderate",     rate: 9,  color: "border-indigo-500/30 bg-indigo-500/10", text: "text-indigo-400" },
                      { key: "aggressive",   label: "Aggressive",   rate: 12, color: "border-purple-500/30 bg-purple-500/10", text: "text-purple-400" },
                    ].map(({ key, label, rate, color, text }) => {
                      const proj = projection.projections[key as keyof typeof projection.projections];
                      return (
                        <div key={key} className={`p-4 rounded-xl border ${color}`}>
                          <div className="flex justify-between">
                            <div>
                              <p className="text-xs text-gray-400">{label}</p>
                              <p className="text-xs text-gray-600">{rate}% annual growth</p>
                            </div>
                            <p className={`text-lg font-bold ${text}`}>
                              KES {proj.value.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-600 text-center mt-2">
                      Projections assume consistent growth rate. Actual returns may vary.
                    </p>
                  </>
                ) : (
                  <p className="text-center text-gray-600 text-sm mt-8">Loading projection...</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Account Modal */}
        {showAccountModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-6">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">
                {editingAccount ? "Edit Account" : "Add Pension Account"}
              </h3>
              <div className="space-y-3">
                <input type="text" placeholder="Provider (e.g. Jubilee Insurance)" value={accountForm.provider}
                  onChange={(e) => setAccountForm((f) => ({ ...f, provider: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
                <input type="text" placeholder="Scheme name (e.g. Individual Pension Plan)" value={accountForm.scheme_name}
                  onChange={(e) => setAccountForm((f) => ({ ...f, scheme_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
                <input type="number" placeholder="Current value (KES)" value={accountForm.total_value}
                  onChange={(e) => setAccountForm((f) => ({ ...f, total_value: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Retirement age" value={accountForm.retirement_age}
                    onChange={(e) => setAccountForm((f) => ({ ...f, retirement_age: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
                  <input type="date" placeholder="Date of birth" value={accountForm.date_of_birth}
                    onChange={(e) => setAccountForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <input type="text" placeholder="Notes (optional)" value={accountForm.notes}
                  onChange={(e) => setAccountForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAccountModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm">Cancel</button>
                <button onClick={handleAccountSubmit}
                  disabled={loading || !accountForm.provider || !accountForm.scheme_name || !accountForm.total_value}
                  className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm disabled:opacity-50">
                  {editingAccount ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Funds Modal */}
        {showFundsModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-6 overflow-y-auto">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800 my-4">
              <h3 className="text-lg font-bold text-white mb-1">Fund Allocations</h3>
              <p className={`text-xs mb-4 ${Math.abs(totalAllocation - 100) < 0.1 ? "text-emerald-400" : "text-yellow-400"}`}>
                Total: {totalAllocation}% {Math.abs(totalAllocation - 100) < 0.1 ? "✓" : "(must equal 100%)"}
              </p>
              <div className="space-y-3 mb-4">
                {fundRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" placeholder="Fund name" value={row.name}
                      onChange={(e) => setFundRows((rows) => rows.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                      className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500" />
                    <input type="number" placeholder="%" value={row.allocation_pct}
                      onChange={(e) => setFundRows((rows) => rows.map((r, j) => j === i ? { ...r, allocation_pct: e.target.value } : r))}
                      className="w-16 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500" />
                    <input type="number" placeholder="Value" value={row.current_value}
                      onChange={(e) => setFundRows((rows) => rows.map((r, j) => j === i ? { ...r, current_value: e.target.value } : r))}
                      className="w-24 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500" />
                    {fundRows.length > 1 && (
                      <button onClick={() => setFundRows((rows) => rows.filter((_, j) => j !== i))}
                        className="text-red-400 text-sm px-1">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setFundRows((rows) => [...rows, { name: "", allocation_pct: "", current_value: "" }])}
                className="w-full py-2 mb-4 rounded-xl border border-dashed border-gray-700 text-gray-500 text-xs hover:border-indigo-500 hover:text-indigo-400">
                + Add fund
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowFundsModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm">Cancel</button>
                <button onClick={handleFundsSubmit}
                  disabled={loading || Math.abs(totalAllocation - 100) > 0.1}
                  className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm disabled:opacity-50">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-6">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Log Withdrawal</h3>
              <div className="space-y-3">
                <input type="number" placeholder="Amount (KES)" value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
                <input type="text" placeholder="Reason (optional)" value={withdrawalForm.reason}
                  onChange={(e) => setWithdrawalForm((f) => ({ ...f, reason: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
                <input type="date" value={withdrawalForm.date}
                  onChange={(e) => setWithdrawalForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
                <input type="text" placeholder="Notes (optional)" value={withdrawalForm.notes}
                  onChange={(e) => setWithdrawalForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowWithdrawalModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm">Cancel</button>
                <button onClick={handleWithdrawalSubmit}
                  disabled={loading || !withdrawalForm.amount}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm disabled:opacity-50">
                  Log
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}