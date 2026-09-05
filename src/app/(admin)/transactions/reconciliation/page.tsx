"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ErrorState } from "@/components/common/ErrorState";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function ReconciliationPage() {
  const { data: vas, isLoading: vasLoading, isError: vasError, error: vasErr, refetch: refetchVas } = useQuery({
    queryKey: QueryKeys.reconciliation(),
    queryFn: adminApi.getVasReconciliation,
  });

  const { data: treasury, isLoading: treLoading, isError: treError, error: treErr, refetch: refetchTre } = useQuery({
    queryKey: QueryKeys.treasury(),
    queryFn: adminApi.getTreasury,
  });

  const chartData = vas
    ? [
        { name: "User Debits", value: vas.totalUserDebits },
        { name: "Provider Cost", value: vas.totalEstimatedProviderCost },
        { name: "Profit", value: vas.totalEstimatedProfit },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="VAS Reconciliation & Treasury" description="Financial reconciliation overview." />

      {vasError && <ErrorState error={vasErr} onRetry={refetchVas} title="Failed to load VAS data" />}
      {treError && <ErrorState error={treErr} onRetry={refetchTre} title="Failed to load treasury data" />}

      {/* VAS */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-widest">VAS Reconciliation</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total User Debits" value={formatMoney(vas?.totalUserDebits)} isLoading={vasLoading} />
          <StatCard title="Est. Provider Cost" value={formatMoney(vas?.totalEstimatedProviderCost)} isLoading={vasLoading} />
          <StatCard title="Est. Profit" value={formatMoney(vas?.totalEstimatedProfit)} isLoading={vasLoading} />
          <StatCard title="Transactions" value={formatNumber(vas?.transactionCount)} isLoading={vasLoading} />
        </div>
      </div>

      {vas && (
        <Card>
          <CardHeader><CardTitle className="text-sm">VAS Financial Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Treasury */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Treasury Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Users" value={formatNumber(treasury?.totalUsers)} isLoading={treLoading} />
          <StatCard title="Active Wallets" value={formatNumber(treasury?.activeWallets)} isLoading={treLoading} />
          <StatCard title="Platform Balance" value={formatMoney(treasury?.totalPlatformBalance)} isLoading={treLoading} />
          <StatCard title="Min Wallet Balance" value={formatMoney(treasury?.minWalletBalance)} isLoading={treLoading} />
          <StatCard title="Max Wallet Balance" value={formatMoney(treasury?.maxWalletBalance)} isLoading={treLoading} />
          <StatCard title="Avg Wallet Balance" value={formatMoney(treasury?.avgWalletBalance)} isLoading={treLoading} />
        </div>
      </div>
    </div>
  );
}
