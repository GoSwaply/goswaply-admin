"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MonitorOff, MonitorCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { DateTime } from "@/components/common/DateTime";
import { maintenanceSchema, type MaintenanceInput } from "@/schemas/system.schema";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [confirmEnable, setConfirmEnable] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.maintenance(),
    queryFn: adminApi.getMaintenance,
  });

  const form = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { isEnabled: false, message: "" },
  });

  useEffect(() => {
    if (data) form.reset({ isEnabled: data.isEnabled, message: data.message });
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (body: MaintenanceInput) => adminApi.setMaintenance(body),
    onSuccess: () => {
      toast.success("Maintenance mode updated.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.maintenance() });
      setConfirmEnable(false);
      setConfirmDisable(false);
    },
    onError: () => toast.error("Failed to update maintenance mode."),
  });

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const isEnabled = data?.isEnabled ?? false;
  const message = form.watch("message");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Maintenance Mode" description="Control platform availability." />

      <RoleGate allow={["SUPER_ADMIN"]} fallback={
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Only Super Admins can manage maintenance mode.</div>
      }>
        {/* Status indicator */}
        <Card className={cn("border-2", isEnabled ? "border-destructive/50 bg-destructive/5" : "border-green-500/30 bg-green-50/30")}>
          <CardContent className="flex items-center gap-4 py-6">
            {isEnabled ? (
              <MonitorOff className="h-10 w-10 text-destructive" />
            ) : (
              <MonitorCheck className="h-10 w-10 text-green-600" />
            )}
            <div>
              <p className="text-lg font-bold">{isEnabled ? "Maintenance Mode Active" : "Platform Operational"}</p>
              <p className="text-sm text-muted-foreground">
                {isEnabled ? "Users cannot access the app." : "All services are running normally."}
              </p>
              {data?.updatedAt && <p className="text-xs text-muted-foreground mt-1">Last changed: <DateTime value={data.updatedAt} /></p>}
            </div>
          </CardContent>
        </Card>

        {/* Config */}
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="maint-msg">Maintenance Message (shown to users)</Label>
              <Textarea
                id="maint-msg"
                {...form.register("message")}
                rows={3}
                placeholder="e.g. We are performing scheduled maintenance. We'll be back shortly."
              />
              {form.formState.errors.message && <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>}
            </div>

            {message && (
              <div className="rounded-lg border bg-amber-50 px-4 py-3">
                <p className="text-xs font-medium text-amber-800 mb-1">User-facing preview:</p>
                <p className="text-sm text-amber-900">{message}</p>
              </div>
            )}

            <div className="flex gap-3">
              {!isEnabled ? (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmEnable(true)}
                  disabled={mutation.isPending}
                >
                  <MonitorOff className="h-4 w-4 mr-2" /> Enable Maintenance Mode
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setConfirmDisable(true)}
                  disabled={mutation.isPending}
                >
                  <MonitorCheck className="h-4 w-4 mr-2" /> Disable Maintenance Mode
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </RoleGate>

      <ConfirmActionDialog
        open={confirmEnable}
        title="Enable Maintenance Mode"
        description="You are about to take the platform offline for all users."
        consequence="Users will immediately see the maintenance message and will be unable to access the app. Only proceed if you have coordinated with your team."
        confirmLabel="Enable Maintenance"
        variant="danger"
        onConfirm={() => mutation.mutate({ isEnabled: true, message: form.getValues("message") })}
        onCancel={() => setConfirmEnable(false)}
        loading={mutation.isPending}
      />

      <ConfirmActionDialog
        open={confirmDisable}
        title="Disable Maintenance Mode"
        description="This will restore user access to the platform."
        confirmLabel="Restore Access"
        variant="warning"
        onConfirm={() => mutation.mutate({ isEnabled: false, message: form.getValues("message") })}
        onCancel={() => setConfirmDisable(false)}
        loading={mutation.isPending}
      />
    </div>
  );
}
