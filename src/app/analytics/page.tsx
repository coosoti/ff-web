"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useAnalyticsStore } from "../../lib/stores/analytics.store";

export default function AnalyticsPage() {
  return <ProtectedRoute><Analytics /></ProtectedRoute>;
}

type Tab = "overview" | "spending" | "budget" | "savings";

const MONTHS_OPTIONS = [3, 6, 12] as const;

const CATEGORY_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-yellow-500", "bg-purple-500",
  "bg-red-500", "bg-orange-500", "bg-indigo-500", "bg-pink-500",
];

function fmt(n: number) { return `KES ${Math.abs(n).toLocaleString()}`; }
function sign(n: number) { return n >= 0 ? "+" : "-"; }

function Analytics() {
  const {
    incomeExpense, spending, budget, savings, networth,
    months, loading, error,
    setMonths, fetchAll, fetchReport, clearError,
  } = useAnalyticsStore();

  const [tab, setTab]             = useState<Tab>("overview");
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function handleMonthsChange(m: number) {
    setMonths(m);
    await fetchAll(m);
  }

  async function handleExportPDF() {
    setExporting(true);
    const report = await fetchReport(months);
    if (!report) { setExporting(false); return; }

    // Build printable HTML and open in new tab
    const html = buildReportHtml(report);
    const win  = window.open("", "_blank");
    if (!win) { setExporting(false); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); setExporting(false); }, 500);
  }

  const ie = incomeExpense;
  const nw = networth;

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-gray-400">Last {months} months</p>
          </div>
          <button onClick={handleExportPDF} disabled={exporting || loading}
            className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-700 disabled:opacity-50">
            {exporting ? "Generating..." : "📄 PDF"}
          </button>
        </div>

        {/* Period selector */}
        <div className="flex rounded-xl overflow-hidden border border-gray-800 mb-5">
          {MONTHS_OPTIONS.map((m) => (
            <button key={m} onClick={() => handleMonthsChange(m)}
              className={`flex-1 py-2 text-xs font-medium transition-colors
                ${months === m ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {m}M
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm flex justify-between">
            <span>{error}</span><button onClick={clearError}>✕</button>
          </div>
        )}

        {loading && <p className="text-center text-gray-500 text-sm py-8">Loading...</p>}

        {/* Tabs */}
        {!loading && (
          <>
            <div className="flex rounded-xl overflow-hidden border border-gray-800 mb-5">
              {(["overview", "spending", "budget", "savings"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-xs font-medium capitalize transition-colors
                    ${tab === t ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* ── Overview ── */}
            {tab === "overview" && ie && nw && (
              <div className="space-y-3">
                {/* Net worth card */}
                <div className={`p-5 rounded-2xl border ${nw.net_worth >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                  <p className="text-xs text-gray-400 mb-1">Net Worth</p>
                  <p className={`text-3xl font-bold ${nw.net_worth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {sign(nw.net_worth)}{fmt(nw.net_worth)}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <p className="text-xs text-gray-500">Assets: <span className="text-white">{fmt(nw.total_assets)}</span></p>
                    <p className="text-xs text-gray-500">Liabilities: <span className="text-red-400">{fmt(nw.total_liabilities)}</span></p>
                  </div>
                </div>

                {/* Income/Expense summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Income",   value: ie.totalIncome,   color: "text-emerald-400" },
                    { label: "Expenses", value: ie.totalExpenses,  color: "text-red-400" },
                    { label: "Avg Saved",value: ie.avgSavings,     color: ie.avgSavings >= 0 ? "text-blue-400" : "text-red-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className={`text-sm font-bold ${color}`}>KES {Math.abs(value).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Monthly trend bars */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <p className="text-xs text-gray-400 mb-3">Monthly Trend</p>
                  <div className="space-y-2">
                    {ie.trend.slice(-6).map((t) => {
                      const maxVal = Math.max(...ie.trend.map((x) => Math.max(x.income, x.expenses)));
                      const incPct = maxVal > 0 ? (t.income / maxVal) * 100 : 0;
                      const expPct = maxVal > 0 ? (t.expenses / maxVal) * 100 : 0;
                      return (
                        <div key={t.month}>
                          <p className="text-xs text-gray-600 mb-1">{t.month}</p>
                          <div className="flex gap-1 items-center h-2">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${incPct}%` }} />
                          </div>
                          <div className="flex gap-1 items-center h-2 mt-0.5">
                            <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${expPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><p className="text-xs text-gray-500">Income</p></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><p className="text-xs text-gray-500">Expenses</p></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Spending ── */}
            {tab === "spending" && spending && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <p className="text-xs text-gray-400 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-white">KES {spending.grandTotal.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  {spending.categories.map((cat, i) => (
                    <div key={cat.id} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                      <div className="flex justify-between mb-1.5">
                        <p className="text-sm font-medium text-white">{cat.name}</p>
                        <p className="text-sm font-bold text-white">KES {cat.total.toLocaleString()}</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-800 mb-1">
                        <div className={`h-1.5 rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} transition-all`}
                          style={{ width: `${cat.pct}%` }} />
                      </div>
                      <div className="flex justify-between">
                        <p className="text-xs text-gray-600 capitalize">{cat.type}</p>
                        <p className="text-xs text-gray-500">{cat.pct}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Budget ── */}
            {tab === "budget" && budget && (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                    <p className="text-xs text-gray-500">Budgeted</p>
                    <p className="text-sm font-bold text-white">KES {budget.summary.total_budgeted.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                    <p className="text-xs text-gray-500">Actual</p>
                    <p className="text-sm font-bold text-white">KES {budget.summary.total_actual.toLocaleString()}</p>
                  </div>
                </div>
                <div className={`p-3 rounded-xl border ${budget.summary.total_variance >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                  <p className="text-xs text-gray-400">Variance ({months} months)</p>
                  <p className={`text-lg font-bold ${budget.summary.total_variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {sign(budget.summary.total_variance)}{fmt(budget.summary.total_variance)}
                  </p>
                </div>
                {/* Per category */}
                <div className="space-y-2">
                  {budget.performance.map((item) => (
                    <div key={item.id} className={`p-3 rounded-xl border ${item.is_over ? "bg-red-500/10 border-red-500/20" : "bg-gray-900 border-gray-800"}`}>
                      <div className="flex justify-between mb-1">
                        <p className="text-xs font-medium text-white">{item.name}</p>
                        <p className={`text-xs font-bold ${item.is_over ? "text-red-400" : "text-emerald-400"}`}>
                          {item.is_over ? "OVER" : "OK"}
                        </p>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Budget: KES {item.budgeted.toLocaleString()}</span>
                        <span>Actual: KES {item.actual.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Savings ── */}
            {tab === "savings" && savings && (
              <div className="space-y-3">
                {/* Summary */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <div className="flex justify-between mb-2">
                    <p className="text-xs text-gray-400">Overall Progress</p>
                    <p className="text-xs font-bold text-white">{savings.summary.overall_pct}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 mb-3">
                    <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${savings.summary.overall_pct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-xs text-gray-500">Saved</p><p className="text-xs font-bold text-white">KES {savings.summary.total_current.toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-500">Target</p><p className="text-xs font-bold text-white">KES {savings.summary.total_target.toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-500">Active</p><p className="text-xs font-bold text-white">{savings.summary.active} goals</p></div>
                  </div>
                </div>
                {/* Per goal */}
                {savings.goals.map((g) => (
                  <div key={g.id} className={`p-4 rounded-xl border ${g.is_completed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-gray-900 border-gray-800"}`}>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-semibold text-white">{g.name}</p>
                      <p className={`text-xs font-bold ${g.is_completed ? "text-emerald-400" : "text-gray-400"}`}>
                        {g.is_completed ? "✓ Done" : `${g.pct}%`}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800 mb-2">
                      <div className={`h-1.5 rounded-full ${g.is_completed ? "bg-emerald-500" : "bg-blue-500"} transition-all`}
                        style={{ width: `${g.pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>KES {g.current.toLocaleString()} / {g.target.toLocaleString()}</span>
                      {g.months_left !== null && <span>{g.months_left}mo left</span>}
                    </div>
                  </div>
                ))}
                {savings.goals.length === 0 && (
                  <p className="text-center text-gray-600 text-sm mt-8">No savings goals yet</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── PDF Report Builder ────────────────────────────────────────────────

function buildReportHtml(r: import("../../types").FullReport): string {
  const date = new Date(r.generated_at).toLocaleDateString("en-KE", { dateStyle: "long" });
  const rows = (items: { label: string; value: string; highlight?: boolean }[]) =>
    items.map(({ label, value, highlight }) =>
      `<tr style="background:${highlight ? "#fef9c3" : "white"}">
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600">${value}</td>
      </tr>`
    ).join("");

  const table = (title: string, body: string) =>
    `<h2 style="font-size:15px;font-weight:700;margin:24px 0 8px;color:#1f2937">${title}</h2>
     <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${body}</table>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Financial Report — ${date}</title>
  <style>body{font-family:system-ui,sans-serif;margin:32px;color:#111827}@media print{body{margin:16px}}</style>
  </head><body>
  <h1 style="font-size:22px;font-weight:800;margin-bottom:4px">Financial Report</h1>
  <p style="color:#6b7280;font-size:13px;margin-bottom:24px">Generated ${date} · Last ${r.months} months</p>

  ${table("Net Worth", rows([
    { label: "Total Assets",      value: `KES ${r.networth.total_assets.toLocaleString()}` },
    { label: "Total Liabilities", value: `KES ${r.networth.total_liabilities.toLocaleString()}` },
    { label: "Net Worth",         value: `KES ${r.networth.net_worth.toLocaleString()}`, highlight: true },
  ]))}

  ${table("Income & Expenses", rows([
    { label: "Total Income",   value: `KES ${r.incomeExpense.totalIncome.toLocaleString()}` },
    { label: "Total Expenses", value: `KES ${r.incomeExpense.totalExpenses.toLocaleString()}` },
    { label: "Avg Monthly Savings", value: `KES ${r.incomeExpense.avgSavings.toLocaleString()}`, highlight: true },
  ]))}

  ${table("Spending by Category", r.spending.categories.slice(0, 10).map((c) =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${c.name}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600">KES ${c.total.toLocaleString()} (${c.pct}%)</td></tr>`
  ).join(""))}

  ${table("Budget Performance", r.budget.performance.filter((p) => p.is_over).slice(0, 8).map((p) =>
    `<tr style="background:#fef2f2"><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${p.name} ⚠️</td>
     <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600;color:#dc2626">
       Over by KES ${Math.abs(p.variance).toLocaleString()}</td></tr>`
  ).join("") || `<tr><td colspan="2" style="padding:12px;text-align:center;color:#6b7280;font-size:13px">All categories within budget 🎉</td></tr>`)}

  ${table("Savings Goals", r.savings.goals.map((g) =>
    `<tr style="background:${g.is_completed ? "#f0fdf4" : "white"}">
     <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${g.name}${g.is_completed ? " ✓" : ""}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600">
       KES ${g.current.toLocaleString()} / ${g.target.toLocaleString()} (${g.pct}%)</td></tr>`
  ).join("") || `<tr><td colspan="2" style="padding:12px;text-align:center;color:#6b7280;font-size:13px">No savings goals</td></tr>`)}

  <p style="margin-top:32px;font-size:11px;color:#9ca3af">This report is generated from your HU Wealth Manager data. For advice, consult a certified financial planner.</p>
  </body></html>`;
}