"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { humanizeKey } from "@/lib/formatters";
import { HIGH_IMPACT_FLAG_KEYWORDS } from "@/lib/constants";
import { toast } from "sonner";

export default function FeatureFlagsPage() {
  const queryClient = useQueryClient();
  const [pendingToggle, setPendingToggle] = useState<{ key: string; value: boolean } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.featureFlags(),
    queryFn: adminApi.getFeatureFlags,
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: boolean }) =>
      adminApi.setFeatureFlag(key, { enabled: value }),
    onSuccess: (_, vars) => {
      toast.success(`Flag "${vars.key}" ${vars.value ? "enabled" : "disabled"}.`);
      queryClient.invalidateQueries({ queryKey: QueryKeys.featureFlags() });
      setPendingToggle(null);
    },
    onError: () => toast.error("Failed to update feature flag."),
  });

  const isHighImpact = (key: string) =>
    HIGH_IMPACT_FLAG_KEYWORDS.some((kw) => key.toLowerCase().includes(kw));

  const handleToggle = (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    if (isHighImpact(key)) {
      setPendingToggle({ key, value: newValue });
    } else {
      updateMutation.mutate({ key, value: newValue });
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const flags = Object.entries(data ?? {});

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Feature Flags" description={`${flags.length} flags configured`} />

      <Card>
        <CardContent className="p-0 divide-y">
          {flags.map(([key, value]) => {
            const isImpactful = isHighImpact(key);
            return (
              <div key={key} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-sm">{humanizeKey(key)}</p>
                  <p className="text-xs text-muted-foreground font-mono">{key}</p>
                  {isImpactful && (
                    <p className="text-xs text-amber-600 mt-0.5">High impact — requires confirmation</p>
                  )}
                </div>
                <RoleGate allow={["SUPER_ADMIN"]} mode="disable">
                  <Switch
                    checked={value}
                    onCheckedChange={() => handleToggle(key, value)}
                    disabled={updateMutation.isPending && updateMutation.variables?.key === key}
                    aria-label={`Toggle ${humanizeKey(key)}`}
                  />
                </RoleGate>
              </div>
            );
          })}
          {flags.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No feature flags configured.</p>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={!!pendingToggle}
        title={`${pendingToggle?.value ? "Enable" : "Disable"} Feature Flag`}
        description={`You are about to ${pendingToggle?.value ? "enable" : "disable"} "${pendingToggle ? humanizeKey(pendingToggle.key) : ""}".`}
        consequence="This is a high-impact flag that may affect customer access to core platform features. Verify before proceeding."
        confirmLabel={pendingToggle?.value ? "Enable Feature" : "Disable Feature"}
        variant="warning"
        onConfirm={() => pendingToggle && updateMutation.mutate(pendingToggle)}
        onCancel={() => setPendingToggle(null)}
        loading={updateMutation.isPending}
      />
    </div>
  );
}
