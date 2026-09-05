"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateTime } from "@/components/common/DateTime";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePagination } from "@/hooks/use-pagination";
import { KYC_PRIVACY_NOTICE } from "@/lib/constants";
import { toast } from "sonner";
import type { KycSubmission } from "@/types";

export default function KycQueuePage() {
  const { page, limit, setPage } = usePagination(20);
  const queryClient = useQueryClient();
  const [viewItem, setViewItem] = useState<KycSubmission | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.kycPending({ page, limit }),
    queryFn: () => adminApi.kycPending({ page, limit }),
    refetchInterval: 30_000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "APPROVED" | "REJECTED"; reason?: string }) =>
      adminApi.reviewKyc(id, { status, reason }),
    onSuccess: (_, vars) => {
      toast.success(`KYC ${vars.status === "APPROVED" ? "approved" : "rejected"}.`);
      queryClient.invalidateQueries({ queryKey: QueryKeys.kycPending() });
      setApproveId(null);
      setRejectId(null);
    },
    onError: () => toast.error("Failed to review KYC submission."),
  });

  const items = data?.data ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="KYC Queue" description={`${data?.total ?? 0} pending submission${data?.total !== 1 ? "s" : ""}`} />

      <PrivacyNotice message={KYC_PRIVACY_NOTICE} />

      {isLoading && <TableSkeleton rows={8} cols={7} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          {items.length === 0 ? (
            <EmptyState title="No KYC submissions waiting for review" />
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Level</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((kyc: KycSubmission) => (
                      <tr key={kyc.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{kyc.userId.slice(0, 8)}…</td>
                        <td className="px-4 py-3">{kyc.firstName} {kyc.lastName}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{kyc.level}</Badge></td>
                        <td className="px-4 py-3"><StatusBadge status={kyc.status} /></td>
                        <td className="px-4 py-3"><DateTime value={kyc.createdAt} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(kyc)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {kyc.status === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-green-600 hover:bg-green-50"
                                  onClick={() => setApproveId(kyc.id)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => setRejectId(kyc.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 border-t">
                <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} isLoading={isLoading} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>KYC Submission</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <PrivacyNotice message="Access to identity documents is for verification purposes only." className="mb-2" />
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Name</p><p>{viewItem.firstName} {viewItem.lastName}</p></div>
                <div><p className="text-xs text-muted-foreground">Level</p><p>{viewItem.level}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewItem.status} /></div>
                <div><p className="text-xs text-muted-foreground">Document Type</p><p>{viewItem.documentType ?? "—"}</p></div>
                {viewItem.rejectionReason && (
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Rejection Reason</p><p>{viewItem.rejectionReason}</p></div>
                )}
                <div><p className="text-xs text-muted-foreground">Submitted</p><DateTime value={viewItem.createdAt} /></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={!!approveId}
        title="Approve KYC Submission"
        description="Approving this submission will verify the user's identity. This action is logged."
        confirmLabel="Approve KYC"
        variant="default"
        onConfirm={() => approveId && reviewMutation.mutate({ id: approveId, status: "APPROVED" })}
        onCancel={() => setApproveId(null)}
        loading={reviewMutation.isPending}
      />

      <ConfirmActionDialog
        open={!!rejectId}
        title="Reject KYC Submission"
        description="Please provide a reason for rejection. The user will be notified."
        confirmLabel="Reject"
        variant="danger"
        requireReason
        reasonLabel="Rejection reason (required)"
        onConfirm={(reason) => rejectId && reviewMutation.mutate({ id: rejectId, status: "REJECTED", reason })}
        onCancel={() => setRejectId(null)}
        loading={reviewMutation.isPending}
      />
    </div>
  );
}
