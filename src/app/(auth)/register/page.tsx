"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/stores/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    monthly_income: "",
    dependents: "0",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        monthly_income: Number(form.monthly_income),
        dependents: Number(form.dependents),
      });
      router.push("/dashboard");
    } catch {}
  }

  const income = Number(form.monthly_income);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-gray-400 text-sm mb-8">Set up Family Finance</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Full name",     field: "name",     type: "text",   placeholder: "Jane Mwangi" },
            { label: "Email",         field: "email",    type: "email",  placeholder: "you@example.com" },
            { label: "Password",      field: "password", type: "password", placeholder: "Min 8 characters" },
            { label: "Monthly income (KES)", field: "monthly_income", type: "number", placeholder: "150000" },
            { label: "Dependents",    field: "dependents", type: "number", placeholder: "0" },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm text-gray-300 mb-1">{label}</label>
              <input
                type={type}
                value={form[field as keyof typeof form]}
                onChange={(e) => set(field, e.target.value)}
                required={field !== "dependents"}
                min={type === "number" ? "0" : undefined}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          ))}

          {/* 50/30/20 preview — only shown once income is entered */}
          {income > 0 && (
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
              <p className="text-xs text-gray-400 font-medium mb-2">Your starting budget</p>
              {[
                { label: "Needs (50%)",   color: "bg-blue-500",    amount: Math.round(income * 0.5) },
                { label: "Wants (30%)",   color: "bg-purple-500",  amount: Math.round(income * 0.3) },
                { label: "Savings (20%)", color: "bg-emerald-500", amount: Math.round(income * 0.2) },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${row.color}`} />
                  <span className="text-gray-400 flex-1">{row.label}</span>
                  <span className="text-gray-200 font-mono">KES {row.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}