"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { toast } from "sonner";

/**
 * Two margins, because the API keeps two.
 *
 * This page used to offer separate crypto-buy, crypto-sell and gift-card
 * margins. None of those existed: the API stores one exchange margin and one
 * VAS margin, so the extra fields displayed nothing and saved nothing.
 *
 * There is deliberately no gift card margin. Gift card payouts come from the
 * rate matrix, where the desk sets the naira-per-unit price outright — taking
 * a margin on top would take the spread twice.
 */
export default function MarginsPage() {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<"exchange" | "vas" | null>(null);
  const [exchangeValue, setExchangeValue] = useState<string>("");
  const [vasValue, setVasValue] = useState<string>("");

  const exchange = useQuery({
    queryKey: QueryKeys.exchangeMargin(),
    queryFn: adminApi.getExchangeMargin,
  });
  const vas = useQuery({
    queryKey: QueryKeys.vasMargin(),
    queryFn: adminApi.getVasMargin,
  });

  useEffect(() => {
    if (exchange.data) setExchangeValue(String(exchange.data.marginPercent));
  }, [exchange.data]);
  useEffect(() => {
    if (vas.data) setVasValue(String(vas.data.marginPercent));
  }, [vas.data]);

  const saveExchange = useMutation({
    mutationFn: () =>
      adminApi.setExchangeMargin({ marginPercent: Number(exchangeValue) }),
    onSuccess: (saved) => {
      toast.success("Exchange margin updated.");
      queryClient.setQueryData(QueryKeys.exchangeMargin(), saved);
      setConfirm(null);
    },
    onError: (e: Error) => toast.error(e.message || "Could not update the exchange margin."),
  });

  const saveVas = useMutation({
    mutationFn: () => adminApi.setVasMargin({ marginPercent: Number(vasValue) }),
    onSuccess: (saved) => {
      toast.success("VAS margin updated.");
      queryClient.setQueryData(QueryKeys.vasMargin(), saved);
      setConfirm(null);
    },
    onError: (e: Error) => toast.error(e.message || "Could not update the VAS margin."),
  });

  if (exchange.isLoading || vas.isLoading) return <PageSkeleton />;

  const valid = (v: string) => {
    const n = Number(v);
    return v !== "" && Number.isFinite(n) && n >= 0 && n <= 100;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Margins"
        description="What the platform keeps on a crypto sell and on bill payments."
      />

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        These change what customers are quoted on their next transaction. Check
        the figure before saving.
      </p>

      {exchange.isError && (
        <ErrorState
          error={exchange.error}
          onRetry={exchange.refetch}
          title="Failed to load the exchange margin"
        />
      )}
      {vas.isError && (
        <ErrorState error={vas.error} onRetry={vas.refetch} title="Failed to load the VAS margin" />
      )}

      {exchange.data && (
        <Card>
          <CardHeader>
            <CardTitle>Crypto Sell Margin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="exchange-margin">Margin (%)</Label>
                <p className="text-xs text-muted-foreground">
                  Currently {exchange.data.marginPercent}%
                </p>
                <Input
                  id="exchange-margin"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={exchangeValue}
                  onChange={(e) => setExchangeValue(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Taken off the live rate, so a customer selling crypto receives{" "}
                  {(100 - (Number(exchangeValue) || 0)).toFixed(2)}% of market.
                </p>
              </div>
              <Button disabled={!valid(exchangeValue)} onClick={() => setConfirm("exchange")}>
                Save Exchange Margin
              </Button>
            </RoleGate>
          </CardContent>
        </Card>
      )}

      {vas.data && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Payment Margin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="vas-margin">Default margin (%)</Label>
                <p className="text-xs text-muted-foreground">
                  Currently {vas.data.marginPercent}%
                </p>
                <Input
                  id="vas-margin"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={vasValue}
                  onChange={(e) => setVasValue(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Applied where a biller has no specific price set under Biller
                  Pricing.
                </p>
              </div>
              <Button disabled={!valid(vasValue)} onClick={() => setConfirm("vas")}>
                Save VAS Margin
              </Button>
            </RoleGate>
          </CardContent>
        </Card>
      )}

      <ConfirmActionDialog
        open={confirm === "exchange"}
        title="Update the crypto sell margin"
        description={`Customers selling crypto will receive ${(100 - (Number(exchangeValue) || 0)).toFixed(2)}% of the market rate.`}
        consequence="This applies to every crypto quote from the moment you save."
        confirmLabel="Update Margin"
        variant="warning"
        onConfirm={() => saveExchange.mutate()}
        onCancel={() => setConfirm(null)}
        loading={saveExchange.isPending}
      />

      <ConfirmActionDialog
        open={confirm === "vas"}
        title="Update the bill payment margin"
        description={`The default margin becomes ${Number(vasValue) || 0}%.`}
        consequence="This applies to every biller without its own price, immediately."
        confirmLabel="Update Margin"
        variant="warning"
        onConfirm={() => saveVas.mutate()}
        onCancel={() => setConfirm(null)}
        loading={saveVas.isPending}
      />
    </div>
  );
}
