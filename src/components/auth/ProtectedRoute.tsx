"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/stores/auth.store";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { fetchMe } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchMe();
  }, []);

  // Don't render anything until client mounts — prevents hydration mismatch
  if (!mounted) return null;

  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  return <>{children}</>;
}