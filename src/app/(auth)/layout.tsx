"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  if (isBootstrapping) return null;
  if (isAuthenticated) return null;

  return <>{children}</>;
}
