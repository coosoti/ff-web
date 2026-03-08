"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/stores/auth.store";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-md mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">
              Hello, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            ✅ Auth complete — Module 2 (Budget) coming next
          </p>
        </div>

      </div>
    </div>
  );
}