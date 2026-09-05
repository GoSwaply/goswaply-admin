"use client";

import React from "react";
import type { AdminRole } from "@/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ForbiddenCard } from "./ForbiddenCard";

interface RoleGateProps {
  allow: AdminRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: "hide" | "disable" | "readonly";
}

export function RoleGate({
  allow,
  children,
  fallback,
  mode = "hide",
}: RoleGateProps) {
  const { user } = useCurrentUser();

  if (!user || !allow.includes(user.role)) {
    if (mode === "hide") return fallback ? <>{fallback}</> : null;
    if (mode === "disable") {
      return (
        <div className="opacity-50 pointer-events-none select-none" aria-disabled="true">
          {children}
        </div>
      );
    }
    // readonly — show but with overlay hint
    return (
      <div className="relative">
        <div className="opacity-60 pointer-events-none select-none">{children}</div>
        <span className="absolute top-0 right-0 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          Read-only
        </span>
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleGatePage({
  allow,
  children,
}: {
  allow: AdminRole[];
  children: React.ReactNode;
}) {
  const { user } = useCurrentUser();
  if (!user || !allow.includes(user.role)) {
    return <ForbiddenCard />;
  }
  return <>{children}</>;
}
