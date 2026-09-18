"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Eye, EyeOff, Gift } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  SellPromptAction,
  SellPromptAudience,
  SellPromptConfig,
  SellPromptFrequency,
} from "@/types";

/** What each token becomes, for the preview and the hint list. */
const TOKENS: { token: string; means: string; example: string }[] = [
  { token: "{brand}", means: "Best-paying card today", example: "Amazon" },
  { token: "{rate}", means: "Its rate, in naira", example: "₦1,925" },
  { token: "{currency}", means: "The card's currency", example: "GBP" },
  { token: "{country}", means: "Where that rate applies", example: "United Kingdom" },
  { token: "{minutes}", means: "Turnaround, in words", example: "60 minutes" },
];

const ACTIONS: Record<SellPromptAction, string> = {
  SELL: "Open the sell form",
  RATES: "Open the rates board",
  URL: "Open a link",
};

const FREQUENCIES: Record<SellPromptFrequency, string> = {
  EVERY_OPEN: "Every time the app opens",
  DAILY: "Once a day",
  ONCE: "Once, ever",
};

const AUDIENCES: Record<SellPromptAudience, string> = {
  EVERYONE: "Everyone",
  NEVER_SOLD: "People who have never sold a card",
  HAS_SOLD: "People who have sold before",
};

function fillTokens(text: string) {
  return TOKENS.reduce(
    (out, t) => out.split(t.token).join(t.example),
    text ?? "",
  );
}

/**
 * The open-app nudge.
 *
 * Copy that needs an app release to change is copy nobody changes, so the
 * words, both buttons and the whole campaign window live here. The figures
 * inside the words stay live — a token written once quotes today's price
 * rather than the price on the day it was typed.
 */
export default function SellPromptPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SellPromptConfig | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.sellPrompt(),
    queryFn: adminApi.getSellPrompt,
  });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (values: SellPromptConfig) => adminApi.setSellPrompt(values),
    onSuccess: (saved) => {
      toast.success("Prompt updated. It reaches the app on the next open.");
      queryClient.setQueryData(QueryKeys.sellPrompt(), saved);
      setConfirming(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not save the prompt."),
  });

  if (isLoading) return <PageSkeleton />;
  if (isError) {
    return (
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="App Prompt" />
        <ErrorState error={error} onRetry={refetch} title="Failed to load the prompt" />
      </div>
    );
  }
  if (!draft) return <PageSkeleton />;

  const set = <K extends keyof SellPromptConfig>(key: K, value: SellPromptConfig[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const dirty = !!data && JSON.stringify(data) !== JSON.stringify(draft);
  const urlNeeded = draft.primaryAction === "URL" && !draft.primaryUrl.trim();

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="App Prompt"
        description="The nudge customers see when they open the app."
        actions={
          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button
              size="sm"
              disabled={!dirty || urlNeeded}
              onClick={() => setConfirming(true)}
            >
              Save Changes
            </Button>
          </RoleGate>
        }
      />

      <Card className={cn(!draft.enabled && "border-amber-300")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {draft.enabled ? (
              <Megaphone className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-amber-600" />
            )}
            {draft.enabled ? "Running" : "Switched off"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
            <div className="flex items-center gap-3">
              <Switch
                id="prompt-enabled"
                checked={draft.enabled}
                onCheckedChange={(v) => set("enabled", v)}
              />
              <Label htmlFor="prompt-enabled" className="font-normal">
                Show this prompt when the app opens
              </Label>
            </div>
          </RoleGate>
          <p className="text-xs text-muted-foreground max-w-prose">
            Two rules are not configurable, on purpose. It never shows when no
            card has a live rate — a prompt to sell with no price behind it
            sends people to an empty board — and it never shows on someone&apos;s
            first launch, which is for finding their bearings.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What it says</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
                <div className="space-y-1.5">
                  <Label htmlFor="prompt-title">Headline</Label>
                  <Input
                    id="prompt-title"
                    value={draft.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prompt-body">Body</Label>
                  <Textarea
                    id="prompt-body"
                    rows={3}
                    value={draft.body}
                    onChange={(e) => set("body", e.target.value)}
                  />
                </div>
              </RoleGate>

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium mb-2">
                  Tokens — replaced with today&apos;s figures when the app asks
                </p>
                <ul className="space-y-1">
                  {TOKENS.map((t) => (
                    <li key={t.token} className="text-xs flex gap-2">
                      <code className="font-mono text-[11px] bg-background border rounded px-1">
                        {t.token}
                      </code>
                      <span className="text-muted-foreground">
                        {t.means} — e.g. {t.example}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prompt-primary">Main button</Label>
                    <Input
                      id="prompt-primary"
                      value={draft.primaryLabel}
                      onChange={(e) => set("primaryLabel", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>It opens</Label>
                    <Select
                      value={draft.primaryAction}
                      onValueChange={(v) => set("primaryAction", v as SellPromptAction)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ACTIONS) as SellPromptAction[]).map((a) => (
                          <SelectItem key={a} value={a}>{ACTIONS[a]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {draft.primaryAction === "URL" && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="prompt-url">Link</Label>
                      <Input
                        id="prompt-url"
                        placeholder="https://goswaply.com/promo"
                        value={draft.primaryUrl}
                        onChange={(e) => set("primaryUrl", e.target.value)}
                      />
                      {urlNeeded && (
                        <p className="text-xs text-destructive">
                          A link button with no link does nothing when tapped.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="prompt-secondary">Dismiss button</Label>
                    <Input
                      id="prompt-secondary"
                      value={draft.secondaryLabel}
                      onChange={(e) => set("secondaryLabel", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Show the live rate card</Label>
                    <div className="flex items-center gap-2 h-9">
                      <Switch
                        checked={draft.showRateCard}
                        onCheckedChange={(v) => set("showRateCard", v)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {draft.showRateCard ? "Shown" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
              </RoleGate>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Who sees it, and how often</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RoleGate allow={["SUPER_ADMIN"]} mode="readonly">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Audience</Label>
                    <Select
                      value={draft.audience}
                      onValueChange={(v) => set("audience", v as SellPromptAudience)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(AUDIENCES) as SellPromptAudience[]).map((a) => (
                          <SelectItem key={a} value={a}>{AUDIENCES[a]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Telling a weekly trader to &ldquo;try selling a gift
                      card&rdquo; is noise.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>How often</Label>
                    <Select
                      value={draft.frequency}
                      onValueChange={(v) => set("frequency", v as SellPromptFrequency)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FREQUENCIES) as SellPromptFrequency[]).map((f) => (
                          <SelectItem key={f} value={f}>{FREQUENCIES[f]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {draft.frequency === "EVERY_OPEN" && (
                      <p className="text-[11px] text-amber-700">
                        People learn to dismiss a prompt they see every time,
                        without reading it.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prompt-starts">Starts (optional)</Label>
                    <Input
                      id="prompt-starts"
                      type="date"
                      value={(draft.startsAt || "").slice(0, 10)}
                      onChange={(e) => set("startsAt", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prompt-ends">Ends (optional)</Label>
                    <Input
                      id="prompt-ends"
                      type="date"
                      value={(draft.endsAt || "").slice(0, 10)}
                      onChange={(e) => set("endsAt", e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      A campaign that stops on its own is one nobody forgets to
                      turn off.
                    </p>
                  </div>
                </div>
              </RoleGate>
            </CardContent>
          </Card>
        </div>

        {/* Preview — the whole point of tokens is that you cannot picture the
            result from the template alone. */}
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-muted/20 p-5 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber-200 to-yellow-300 grid place-items-center">
                <Gift className="h-6 w-6 text-amber-900" />
              </div>
              <p className="font-bold text-[15px] leading-snug">
                {fillTokens(draft.title) || "Your headline"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {fillTokens(draft.body)}
              </p>
              {draft.showRateCard && (
                <div className="rounded-xl border bg-background px-3 py-2.5 flex items-center gap-2 text-left">
                  <span className="h-8 w-8 rounded bg-muted grid place-items-center shrink-0">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold">Amazon</span>
                    <span className="block text-[10px] text-muted-foreground">
                      Best on United Kingdom · Physical card with receipt
                    </span>
                  </span>
                  <span className="text-xs font-bold">₦1,925</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <div className="flex-1 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                  {draft.secondaryLabel || "Not now"}
                </div>
                <div className="flex-[2] rounded-lg bg-foreground text-background px-3 py-2 text-xs font-semibold">
                  {draft.primaryLabel || "Sell a gift card"}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Figures shown are examples. The app fills them with the
              best-paying card at the moment it asks.
            </p>
          </CardContent>
        </Card>
      </div>

      <ConfirmActionDialog
        open={confirming}
        title="Update the app prompt"
        description="Customers see this the next time they open the app."
        consequence={
          draft.enabled
            ? `Shown to ${AUDIENCES[draft.audience].toLowerCase()}, ${FREQUENCIES[draft.frequency].toLowerCase()}.`
            : "The prompt is switched off, so nobody will see it."
        }
        confirmLabel="Save Prompt"
        variant="warning"
        onConfirm={() => save.mutate(draft)}
        onCancel={() => setConfirming(false)}
        loading={save.isPending}
      />
    </div>
  );
}
