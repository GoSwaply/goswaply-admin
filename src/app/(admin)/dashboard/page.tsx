"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users, ArrowLeftRight, Bitcoin, Gift, ScanFace, Activity,
  AlertCircle,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateTime } from "@/components/common/DateTime";
import { formatNumber } from "@/lib/formatters";

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: QueryKeys.overview(),
    queryFn: adminApi.overview,
    refetchInterval: 60_000,
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: QueryKeys.gatewayHealth(),
    queryFn: adminApi.gatewayHealth,
    refetchInterval: 30_000,
  });

  const downCount = health?.filter((g) => g.status === "DOWN").length ?? 0;
  const totalGateways = health?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Operational overview for Swapply platform."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(overview?.totalUsers)}
          icon={<Users className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Transactions"
          value={formatNumber(overview?.totalTransactions)}
          icon={<ArrowLeftRight className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Crypto"
          value={formatNumber(overview?.pendingCryptoRequests)}
          icon={<Bitcoin className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Gift Cards"
          value={formatNumber(overview?.pendingGiftCardRequests)}
          icon={<Gift className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Pending KYC"
          value={formatNumber(overview?.pendingKycSubmissions)}
          icon={<ScanFace className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Gateway Health"
          value={healthLoading ? "..." : downCount === 0 ? "All Systems Go" : `${downCount} Down`}
          description={`${totalGateways} gateways monitored`}
          icon={<Activity className="h-4 w-4" />}
          isLoading={healthLoading}
          className={downCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gateway strip */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Gateway Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !health || health.length === 0 ? (
              <p className="text-sm text-muted-foreground">No gateways configured.</p>
            ) : (
              <div className="space-y-2">
                {health.map((g) => (
                  <div key={g.name} className="flex items-center justify-between py-1 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {g.latencyMs && (
                        <span className="text-xs text-muted-foreground">{g.latencyMs}ms</span>
                      )}
                      <StatusBadge status={g.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent audit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Recent Audit Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !overview?.recentAuditLogs || overview.recentAuditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent audit events.</p>
            ) : (
              <div className="space-y-2">
                {overview.recentAuditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-start justify-between py-1 border-b last:border-0">
                    <div>
                      <p className="text-xs font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.resource}</p>
                    </div>
                    <DateTime value={log.createdAt} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
