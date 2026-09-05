"use client";

import { useState } from "react";
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

export default function MarginsPage() {
  const queryClient = useQueryClient();
  const [confirmExchange, setConfirmExchange] = useState(false);
  const [confirmVas, setConfirmVas] = useState(false);

  const { data: exchange, isLoading: exLoading, isError: exError, error: exErr, refetch: refetchEx } = useQuery({
    queryKey: QueryKeys.exchangeMargin(),
    queryFn: adminApi.getExchangeMargin,
  });

  const { data: vas, isLoading: vasLoading, isError: vasError, error: vasErr, refetch: refetchVas } = useQuery({
    queryKey: QueryKeys.vasMargin(),
    queryFn: adminApi.getVasMargin,
  });

  const [exValues, setExValues] = useState({ cryptoBuyMarginPercent: 0, cryptoSellMarginPercent: 0, giftCardMarginPercent: 0 });
  const [vasValue, setVasValue] = useState(0);

  const updateExMutation = useMutation({
    mutationFn: () => adminApi.setExchangeMargin(exValues),
    onSuccess: () => {
      toast.success("Exchange margins updated.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.exchangeMargin() });
      setConfirmExchange(false);
    },
    onError: () => toast.error("Failed to update exchange margins."),
  });

  const updateVasMutation = useMutation({
    mutationFn: () => adminApi.setVasMargin({ defaultVasMarginPercent: vasValue }),
    onSuccess: () => {
      toast.success("VAS margin updated.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.vasMargin() });
      setConfirmVas(false);
    },
    onError: () => toast.error("Failed to update VAS margin."),
  });

  if (exLoading || vasLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Margins" description="Configure exchange and VAS margin percentages." />

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        Margin changes affect profit calculations and customer pricing. Verify values carefully before saving.
      </p>

      {exError && <ErrorState error={exErr} onRetry={refetchEx} title="Failed to load exchange margins" />}
      {vasError && <ErrorState error={vasErr} onRetry={refetchVas} title="Failed to load VAS margin" />}

      {/* Exchange Margin */}
      {exchange && (
        <Card>
          <CardHeader>
            <CardTitle>Exchange Margins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Crypto Buy Margin (%)", key: "cryptoBuyMarginPercent", current: exchange.cryptoBuyMarginPercent },
                  { label: "Crypto Sell Margin (%)", key: "cryptoSellMarginPercent", current: exchange.cryptoSellMarginPercent },
                  { label: "Gift Card Margin (%)", key: "giftCardMarginPercent", current: exchange.giftCardMarginPercent },
                ].map(({ label, key, current }) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <p className="text-xs text-muted-foreground">Current: {current}%</p>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      defaultValue={current}
                      onChange={(e) => setExValues((v) => ({ ...v, [key]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => { setExValues({ cryptoBuyMarginPercent: exchange.cryptoBuyMarginPercent, cryptoSellMarginPercent: exchange.cryptoSellMarginPercent, giftCardMarginPercent: exchange.giftCardMarginPercent }); setConfirmExchange(true); }}>
                Save Exchange Margins
              </Button>
            </RoleGate>
          </CardContent>
        </Card>
      )}

      {/* VAS Margin */}
      {vas && (
        <Card>
          <CardHeader>
            <CardTitle>VAS Default Margin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
              <div className="max-w-xs space-y-1.5">
                <Label>Default VAS Margin (%)</Label>
                <p className="text-xs text-muted-foreground">Current: {vas.defaultVasMarginPercent}%</p>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  defaultValue={vas.defaultVasMarginPercent}
                  onChange={(e) => setVasValue(parseFloat(e.target.value) || 0)}
                />
              </div>
              <Button onClick={() => setConfirmVas(true)}>Save VAS Margin</Button>
            </RoleGate>
          </CardContent>
        </Card>
      )}

      <ConfirmActionDialog
        open={confirmExchange}
        title="Update Exchange Margins"
        description="You are about to update the exchange margin configuration."
        consequence="This will affect all new crypto and gift card exchange calculations immediately."
        confirmLabel="Update Margins"
        variant="warning"
        onConfirm={() => updateExMutation.mutate()}
        onCancel={() => setConfirmExchange(false)}
        loading={updateExMutation.isPending}
      />

      <ConfirmActionDialog
        open={confirmVas}
        title="Update VAS Margin"
        description="You are about to update the default VAS margin."
        consequence="This will affect all VAS transaction profit calculations immediately."
        confirmLabel="Update VAS Margin"
        variant="warning"
        onConfirm={() => updateVasMutation.mutate()}
        onCancel={() => setConfirmVas(false)}
        loading={updateVasMutation.isPending}
      />
    </div>
  );
}
