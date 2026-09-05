"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { DateTime } from "@/components/common/DateTime";
import { cn } from "@/lib/utils";
import type { GatewayHealth } from "@/types";

function HealthIcon({ status }: { status: string }) {
  if (status === "UP") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (status === "DOWN") return <XCircle className="h-5 w-5 text-destructive" />;
  return <AlertTriangle className="h-5 w-5 text-amber-500" />;
}

export default function GatewayHealthPage() {
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: QueryKeys.gatewayHealth(),
    queryFn: adminApi.gatewayHealth,
    refetchInterval: 30_000,
  });

  const gateways = data ?? [];
  const downCount = gateways.filter((g) => g.status === "DOWN").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Gateway Health"
        description="Real-time status of integrated payment and service gateways."
        actions={
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-muted-foreground">
          Last checked: {new Date(dataUpdatedAt).toLocaleTimeString()} · Auto-refreshes every 30s
        </p>
      )}

      {downCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">
            {downCount} gateway{downCount !== 1 ? "s" : ""} currently down. Investigate immediately.
          </p>
        </div>
      )}

      {isLoading && <TableSkeleton rows={4} cols={5} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways.map((gw: GatewayHealth) => (
            <Card
              key={gw.name}
              className={cn(
                "border-l-4",
                gw.status === "UP" && "border-l-green-500",
                gw.status === "DOWN" && "border-l-destructive bg-destructive/5",
                gw.status === "DEGRADED" && "border-l-amber-500 bg-amber-50/50",
              )}
            >
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{gw.name}</p>
                  <HealthIcon status={gw.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{gw.url}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status: {gw.statusCode ?? "—"}</span>
                  {gw.latencyMs !== null && <span>{gw.latencyMs}ms</span>}
                </div>
                {gw.error && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{gw.error}</p>
                )}
                <DateTime value={gw.checkedAt} />
              </CardContent>
            </Card>
          ))}
          {gateways.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm text-muted-foreground">No gateways configured.</div>
          )}
        </div>
      )}
    </div>
  );
}
