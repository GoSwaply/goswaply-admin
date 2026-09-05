"use client";

import { useUiStore } from "@/stores/ui-store";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PRIVACY_FOOTER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const { sidebarOpen } = useUiStore();
  const { clearAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  useIdleTimeout({
    enabled: isAuthenticated,
    onWarn: () => setShowIdleWarning(true),
    onTimeout: async () => {
      setShowIdleWarning(false);
      await authApi.logout();
      clearAuth();
      router.push("/login");
    },
  });

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <div
          className={cn(
            "hidden md:flex flex-col transition-all duration-200 ease-in-out shrink-0",
            sidebarOpen ? "w-56" : "w-14"
          )}
        >
          <Sidebar collapsed={!sidebarOpen} />
        </div>

        {/* Main */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar title={title} />
          <main className="flex-1 overflow-y-auto">
            <div className="container-fluid max-w-screen-2xl mx-auto p-6">
              {children}
            </div>
          </main>
          <footer className="border-t bg-card/50 px-6 py-2 text-center">
            <p className="text-[10px] text-muted-foreground">{PRIVACY_FOOTER}</p>
          </footer>
        </div>
      </div>

      {/* Idle session warning */}
      <ConfirmActionDialog
        open={showIdleWarning}
        title="Session About to Expire"
        description="Your admin session will expire due to inactivity. Do you want to stay logged in?"
        confirmLabel="Stay Logged In"
        cancelLabel="Log Out"
        variant="warning"
        onConfirm={() => setShowIdleWarning(false)}
        onCancel={async () => {
          setShowIdleWarning(false);
          await authApi.logout();
          clearAuth();
          router.push("/login");
        }}
      />
    </TooltipProvider>
  );
}
