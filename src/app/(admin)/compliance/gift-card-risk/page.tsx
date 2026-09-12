"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, Eye } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { GiftCardRiskConfig, RiskAction } from "@/types";

const ACTION_LABELS: Record<RiskAction, string> = {
  BLOCK: "Refuse the submission",
  FLAG: "Accept, mark for review",
  OFF: "Do not check",
};

/**
 * Each rule, described by what it actually stops rather than by its field name.
 * The desk tuning these needs to know which kind of fraud each one is for.
 */
const RULES: {
  key: "duplicateImageAction" | "velocityAction" | "dailyValueAction";
  title: string;
  catches: string;
  thresholds: {
    key: keyof GiftCardRiskConfig;
    label: string;
    hint: string;
    money?: boolean;
  }[];
}[] = [
  {
    key: "duplicateImageAction",
    title: "The same card, twice",
    catches:
      "Matches the uploaded photo against every card already submitted. Catches a card resold after rejection, and the same card sent from two accounts. Nobody uploads a byte-identical photo twice by accident.",
    thresholds: [],
  },
  {
    key: "velocityAction",
    title: "Submitting faster than anyone can review",
    catches:
      "Counts how many cards an account has sent recently, and how many it already has waiting. Stops one account flooding the queue.",
    thresholds: [
      {
        key: "maxPendingSubmissions",
        label: "Cards awaiting review",
        hint: "How many unreviewed submissions one account may have open.",
      },
      { key: "maxSubmissionsPerHour", label: "Per hour", hint: "Submissions in a rolling hour." },
      { key: "maxSubmissionsPerDay", label: "Per day", hint: "Submissions in a rolling 24 hours." },
    ],
  },
  {
    key: "dailyValueAction",
    title: "Too much value in a day",
    catches:
      "Totals the payout an account has submitted in 24 hours. A genuine seller with a large batch will hit this honestly, which is why it flags for review by default rather than refusing.",
    thresholds: [
      {
        key: "maxPayoutNairaPerDay",
        label: "Payout per day",
        hint: "Total naira of quoted payout in a rolling 24 hours.",
        money: true,
      },
    ],
  },
];

export default function GiftCardRiskPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<GiftCardRiskConfig | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.giftCardRiskConfig(),
    queryFn: adminApi.getGiftCardRiskConfig,
  });

  // The form edits a copy, so an unsaved change is never mistaken for live
  // configuration and a failed save leaves the page honest.
  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (values: GiftCardRiskConfig) => adminApi.setGiftCardRiskConfig(values),
    onSuccess: (saved) => {
      toast.success("Fraud controls updated.");
      queryClient.setQueryData(QueryKeys.giftCardRiskConfig(), saved);
      setConfirming(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not save the fraud controls."),
  });

  if (isLoading) return <PageSkeleton />;
  if (isError) {
    return (
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="Gift Card Fraud Controls" />
        <ErrorState error={error} onRetry={refetch} title="Failed to load fraud controls" />
      </div>
    );
  }
  if (!draft) return <PageSkeleton />;

  const set = <K extends keyof GiftCardRiskConfig>(key: K, value: GiftCardRiskConfig[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const dirty = !!data && JSON.stringify(data) !== JSON.stringify(draft);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Gift Card Fraud Controls"
        description="Checked on every submission, before the card image is even stored."
        actions={
          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button size="sm" disabled={!dirty} onClick={() => setConfirming(true)}>
              Save Changes
            </Button>
          </RoleGate>
        }
      />

      {/* Enforcement state reads at a glance — it decides whether any of this bites. */}
      <Card className={cn(!draft.enforced && "border-amber-300")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {draft.enforced ? (
              <ShieldCheck className="h-4 w-4 text-green-600" />
            ) : (
              <Eye className="h-4 w-4 text-amber-600" />
            )}
            {draft.enforced ? "Enforcing" : "Watching only"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
            <div className="flex items-center gap-3">
              <Switch
                id="risk-enforced"
                checked={draft.enforced}
                onCheckedChange={(v) => set("enforced", v)}
              />
              <Label htmlFor="risk-enforced" className="font-normal">
                Refuse submissions that break a rule
              </Label>
            </div>
          </RoleGate>
          <p className="text-xs text-muted-foreground max-w-prose">
            {draft.enforced
              ? "Submissions that break a blocking rule are refused, and the customer is told why in plain words."
              : "Nothing is refused. Every rule still runs, and what it would have stopped is written to the submission and the log — use this to check a threshold against real traffic before you turn it on."}
          </p>
        </CardContent>
      </Card>

      {RULES.map((rule) => {
        const action = draft[rule.key];
        return (
          <Card key={rule.key} className={cn(action === "OFF" && "opacity-70")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {action === "BLOCK" ? (
                  <ShieldAlert className="h-4 w-4 text-green-600" />
                ) : action === "FLAG" ? (
                  <Eye className="h-4 w-4 text-amber-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                )}
                {rule.title}
                <Badge
                  variant={action === "OFF" ? "outline" : "default"}
                  className="text-[10px] ml-1"
                >
                  {ACTION_LABELS[action]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground max-w-prose">{rule.catches}</p>
              <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label>When it fires</Label>
                    <Select
                      value={action}
                      onValueChange={(v) => set(rule.key, v as RiskAction)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ACTION_LABELS) as RiskAction[]).map((a) => (
                          <SelectItem key={a} value={a}>
                            {ACTION_LABELS[a]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {rule.thresholds.map((t) => (
                    <div key={t.key} className="space-y-1.5">
                      <Label htmlFor={`risk-${t.key}`}>{t.label}</Label>
                      <Input
                        id={`risk-${t.key}`}
                        type="number"
                        min={0}
                        step={t.money ? "1000" : "1"}
                        disabled={action === "OFF"}
                        value={String(draft[t.key] ?? 0)}
                        onChange={(e) =>
                          set(
                            t.key,
                            (Number(e.target.value) || 0) as GiftCardRiskConfig[typeof t.key],
                          )
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {t.money
                          ? formatMoney(Number(draft[t.key]) || 0)
                          : t.hint}
                      </p>
                    </div>
                  ))}
                </div>
              </RoleGate>
            </CardContent>
          </Card>
        );
      })}

      <ConfirmActionDialog
        open={confirming}
        title="Update fraud controls"
        description="These take effect on the next submission."
        consequence={
          draft.enforced
            ? "Submissions breaking a blocking rule will be refused straight away. Set the thresholds too tight and honest sellers are turned away."
            : "Enforcement is off, so nothing will be refused — every rule only watches and records."
        }
        confirmLabel="Save Controls"
        variant="warning"
        onConfirm={() => save.mutate(draft)}
        onCancel={() => setConfirming(false)}
        loading={save.isPending}
      />
    </div>
  );
}
