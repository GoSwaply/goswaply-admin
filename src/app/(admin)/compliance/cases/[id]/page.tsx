"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldBan } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateTime } from "@/components/common/DateTime";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";
import { RoleGate } from "@/components/rbac/RoleGate";
import { caseNoteSchema, type CaseNoteInput } from "@/schemas/compliance.schema";
import { CASE_TRANSITIONS, COMPLIANCE_CASE_NOTICE } from "@/lib/constants";
import { toast } from "sonner";
import type { CaseStatus } from "@/types";

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmStatus, setConfirmStatus] = useState<CaseStatus | null>(null);

  const { data: caseData, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.caseDetail(id),
    queryFn: () => adminApi.getCase(id),
  });

  const updateMutation = useMutation({
    mutationFn: ({ status, note }: { status?: string; note?: string }) =>
      adminApi.updateCase(id, { status, note }),
    onSuccess: () => {
      toast.success("Case updated.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.caseDetail(id) });
      setConfirmStatus(null);
    },
    onError: () => toast.error("Failed to update case."),
  });

  const noteForm = useForm<CaseNoteInput>({
    resolver: zodResolver(caseNoteSchema),
  });

  const addNote = (values: CaseNoteInput) => {
    updateMutation.mutate({ note: values.note });
    noteForm.reset();
  };

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!caseData) return null;

  const validTransitions = CASE_TRANSITIONS[caseData.status] ?? [];

  const STATUS_LABELS: Record<string, string> = {
    INVESTIGATING: "Start Investigation",
    FUNDS_FROZEN: "Freeze Funds",
    RESOLVED: "Resolve Case",
    CLOSED: "Close Case",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/compliance/cases")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Cases
        </Button>
        <PageHeader title={`Case ${id.slice(0, 8)}…`} description={`User: ${caseData.userId.slice(0, 8)}…`} />
      </div>

      <PrivacyNotice message={COMPLIANCE_CASE_NOTICE} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Case Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={caseData.status} /></div>
            <div><p className="text-xs text-muted-foreground">User ID</p><p className="font-mono text-xs">{caseData.userId}</p></div>
            {caseData.transactionId && <div><p className="text-xs text-muted-foreground">Transaction</p><p className="font-mono text-xs">{caseData.transactionId}</p></div>}
            <div><p className="text-xs text-muted-foreground">Opened By</p><p>{caseData.createdBy}</p></div>
            <div><p className="text-xs text-muted-foreground">Assigned To</p><p>{caseData.assignedTo ?? "Unassigned"}</p></div>
            <div><p className="text-xs text-muted-foreground">Created</p><DateTime value={caseData.createdAt} /></div>
            <div className="col-span-2"><p className="text-xs text-muted-foreground">Flag Reason</p><p className="mt-1">{caseData.flagReason}</p></div>
          </CardContent>
        </Card>

        {/* Workflow */}
        <RoleGate allow={["SUPER_ADMIN"]}>
          <Card>
            <CardHeader><CardTitle>Workflow Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {validTransitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions available.</p>
              ) : (
                validTransitions.map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    variant={nextStatus === "FUNDS_FROZEN" ? "destructive" : nextStatus === "CLOSED" ? "outline" : "default"}
                    className="w-full"
                    onClick={() => setConfirmStatus(nextStatus as CaseStatus)}
                  >
                    {nextStatus === "FUNDS_FROZEN" && <ShieldBan className="h-4 w-4 mr-2" />}
                    {STATUS_LABELS[nextStatus] ?? nextStatus}
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
        </RoleGate>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>Case Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {caseData.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {caseData.notes.map((note) => (
                <div key={note.id} className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{note.addedBy}</span>
                    <DateTime value={note.createdAt} />
                  </div>
                  <p className="text-sm">{note.note}</p>
                </div>
              ))}
            </div>
          )}

          <RoleGate allow={["SUPER_ADMIN"]}>
            <form onSubmit={noteForm.handleSubmit(addNote)} className="space-y-2 pt-2 border-t">
              <Label>Add Note</Label>
              <Textarea {...noteForm.register("note")} rows={3} placeholder="Enter your case note..." />
              {noteForm.formState.errors.note && <p className="text-xs text-destructive">{noteForm.formState.errors.note.message}</p>}
              <Button type="submit" size="sm" disabled={updateMutation.isPending}>Add Note</Button>
            </form>
          </RoleGate>
        </CardContent>
      </Card>

      {/* Status change confirm */}
      <ConfirmActionDialog
        open={!!confirmStatus}
        title={`${STATUS_LABELS[confirmStatus ?? ""] ?? confirmStatus}`}
        description={`Are you sure you want to change the case status to ${confirmStatus}?`}
        consequence={
          confirmStatus === "FUNDS_FROZEN"
            ? "This will freeze the user's wallet. The user will not be able to transact until the case is resolved. This action is irreversible without explicit resolution."
            : confirmStatus === "RESOLVED"
            ? "Resolving this case will unfreeze any frozen funds and close the investigation."
            : undefined
        }
        confirmLabel={STATUS_LABELS[confirmStatus ?? ""] ?? "Confirm"}
        variant={confirmStatus === "FUNDS_FROZEN" ? "danger" : "default"}
        onConfirm={() => confirmStatus && updateMutation.mutate({ status: confirmStatus })}
        onCancel={() => setConfirmStatus(null)}
        loading={updateMutation.isPending}
      />
    </div>
  );
}
