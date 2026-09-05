"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api/admin-api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { broadcastSchema, type BroadcastInput } from "@/schemas/system.schema";
import { toast } from "sonner";
import type { NotificationSegment } from "@/types";

export default function NotificationsPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastResult, setLastResult] = useState<{ queued: number } | null>(null);

  const form = useForm<BroadcastInput>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { segment: "ACTIVE", subject: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: BroadcastInput) =>
      adminApi.broadcastNotification({
        ...data,
        emails: data.emails?.filter(Boolean),
      }),
    onSuccess: (result) => {
      toast.success(`Notification queued for ${result.queued} recipients.`);
      setLastResult({ queued: result.queued });
      setShowConfirm(false);
      form.reset({ segment: "ACTIVE", subject: "", message: "" });
    },
    onError: () => {
      toast.error("Failed to queue notification.");
      setShowConfirm(false);
    },
  });

  const segment = form.watch("segment") as NotificationSegment;
  const isAllSegment = segment === "ALL";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Broadcast Notifications" description="Send platform-wide or segmented notifications." />

      <RoleGate allow={["SUPER_ADMIN"]} fallback={
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Only Super Admins can send broadcast notifications.</div>
      }>
        <Card>
          <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">
              Consider customer communications compliance and opt-out obligations before sending. Queued notifications are irreversible.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(() => setShowConfirm(true))} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Recipient Segment</Label>
                <Select value={segment} onValueChange={(v) => form.setValue("segment", v as NotificationSegment)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="ACTIVE">Active Users</SelectItem>
                    <SelectItem value="INACTIVE">Inactive Users</SelectItem>
                    <SelectItem value="SPECIFIC">Specific Emails</SelectItem>
                  </SelectContent>
                </Select>
                {isAllSegment && (
                  <p className="text-xs text-destructive mt-1">
                    Warning: This will target ALL eligible users on the platform.
                  </p>
                )}
              </div>

              {segment === "SPECIFIC" && (
                <div className="space-y-1.5">
                  <Label>Email Addresses (comma-separated)</Label>
                  <Textarea
                    placeholder="user1@example.com, user2@example.com"
                    rows={3}
                    onChange={(e) => {
                      const emails = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      form.setValue("emails", emails);
                    }}
                  />
                  {form.formState.errors.emails && (
                    <p className="text-xs text-destructive">{form.formState.errors.emails.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input {...form.register("subject")} placeholder="Notification subject line" />
                {form.formState.errors.subject && <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea {...form.register("message")} rows={5} placeholder="Notification body..." />
                {form.formState.errors.message && <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>}
              </div>

              <Button type="submit">Review &amp; Send</Button>
            </form>
          </CardContent>
        </Card>

        {lastResult && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-800">
              Notification queued for {lastResult.queued} recipient{lastResult.queued !== 1 ? "s" : ""}.
            </p>
            <p className="text-xs text-green-700 mt-0.5">Not yet delivered. Delivery depends on your notification provider queue.</p>
          </div>
        )}
      </RoleGate>

      <ConfirmActionDialog
        open={showConfirm}
        title="Queue Broadcast Notification"
        description={isAllSegment
          ? "You are about to queue a notification to all eligible users. This action may affect customer trust and regulatory communications."
          : `You are about to queue a notification to the "${segment}" segment.`}
        consequence={isAllSegment
          ? "This action may affect customer trust and regulatory communications. Ensure opt-out compliance before proceeding."
          : undefined}
        confirmLabel="Confirm & Queue"
        variant={isAllSegment ? "danger" : "warning"}
        onConfirm={() => mutation.mutate(form.getValues())}
        onCancel={() => setShowConfirm(false)}
        loading={mutation.isPending}
      />
    </div>
  );
}
