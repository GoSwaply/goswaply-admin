"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  if (isBootstrapping) return null;
  if (!isAuthenticated) return null;

  return <AppShell>{children}</AppShell>;
}
