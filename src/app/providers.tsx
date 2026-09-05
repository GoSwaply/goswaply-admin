"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";
import { setClientToken } from "@/lib/api/client";

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setBootstrapping, isBootstrapping } = useAuthStore();

  useEffect(() => {
    authApi
      .refresh()
      .then((data) => {
        if (data) {
          setClientToken(data.accessToken);
          setAuth(data.accessToken, data.user);
        } else {
          clearAuth();
        }
      })
      .catch(() => clearAuth());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying session&hellip;</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap>{children}</SessionBootstrap>
      <Toaster richColors position="top-right" duration={4000} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
