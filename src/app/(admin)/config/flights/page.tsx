"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { RoleGate } from "@/components/rbac/RoleGate";
import { toast } from "sonner";
import type { FlightReferralConfig } from "@/types";

const EMPTY: FlightReferralConfig = {
  enabled: false,
  url: "",
  label: "Book flights",
  description:
    "Flights are booked on our partner's site. You'll leave Swaply to finish your booking.",
};

function isHttps(url: string) {
  return /^https:\/\/\S+$/i.test(url.trim());
}

export default function FlightReferralPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FlightReferralConfig>(EMPTY);

  const { data, isLoading, error } = useQuery({
    queryKey: QueryKeys.flightReferral(),
    queryFn: adminApi.getFlightReferral,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (body: Partial<FlightReferralConfig>) =>
      adminApi.setFlightReferral(body),
    onSuccess: (saved) => {
      queryClient.setQueryData(QueryKeys.flightReferral(), saved);
      setForm(saved);
      // The server refuses to go live without an https link, so say which of
      // the two things actually happened rather than a flat "Saved".
      toast.success(
        saved.enabled
          ? "Saved. The flights tile is now live in the app."
          : "Saved. The flights tile is hidden.",
      );
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error as Error} />;

  const urlLooksWrong = form.url.trim().length > 0 && !isHttps(form.url);
  const wouldBeHidden = form.enabled && !isHttps(form.url);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flights"
        description="Flights are booked on a partner's site. Swaply sends the customer there and earns commission — there is no booking, payment or refund on our side."
      />

      <Card>
        <CardHeader>
          <CardTitle>Partner link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-6 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="enabled">Show flights in the app</Label>
              <p className="text-sm text-muted-foreground">
                Off means no tile at all on the home screen. Customers never see
                a flights option that goes nowhere.
              </p>
            </div>
            <Switch
              id="enabled"
              checked={form.enabled}
              onCheckedChange={(enabled) => setForm({ ...form, enabled })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Booking link</Label>
            <Input
              id="url"
              value={form.url}
              placeholder="https://partner.example.com/flights?ref=swaply"
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Include whatever tracking or affiliate parameters the partner gave
              you — this is the exact address the customer opens, so commission
              is only credited if they are in the link.
            </p>
            {urlLooksWrong && (
              <p className="text-sm text-destructive">
                The link must start with https://. The app blocks plain http, so
                an http link would silently fail on the device.
              </p>
            )}
            {form.url && isHttps(form.url) && (
              <a
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open it and check it lands where you expect
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Tile label</Label>
            <Input
              id="label"
              value={form.label}
              maxLength={40}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Before they leave</Label>
            <Textarea
              id="description"
              rows={3}
              maxLength={240}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Shown in a sheet before the customer leaves the app. Be clear that
              booking and payment happen on the partner's site, not with their
              Swaply balance.
            </p>
          </div>

          {wouldBeHidden && (
            <p className="rounded-md bg-muted p-3 text-sm">
              Saving now stores this as off, because there is no valid https
              link to send anyone to.
            </p>
          )}

          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button
              onClick={() => save.mutate(form)}
              disabled={save.isPending}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </RoleGate>
        </CardContent>
      </Card>
    </div>
  );
}
