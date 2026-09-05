"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Money } from "@/components/common/Money";
import { DateTime } from "@/components/common/DateTime";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { CryptoSellRequest, GiftCardSellRequest } from "@/types";

type ExchangeItem = CryptoSellRequest | GiftCardSellRequest;

interface ExchangeQueueTableProps {
  items: ExchangeItem[];
  type: "crypto" | "gift-card";
  onApprove: (id: string) => Promise<unknown>;
  onReject: (id: string, reason: string) => Promise<unknown>;
  invalidateKey: readonly unknown[];
}

function isCrypto(item: ExchangeItem): item is CryptoSellRequest {
  return "cryptoAsset" in item;
}

export function ExchangeQueueTable({
  items,
  type,
  onApprove,
  onReject,
  invalidateKey,
}: ExchangeQueueTableProps) {
  const queryClient = useQueryClient();
  const [viewItem, setViewItem] = useState<ExchangeItem | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => onApprove(id),
    onSuccess: () => {
      toast.success(`${type === "crypto" ? "Crypto" : "Gift card"} request approved.`);
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setApproveId(null);
    },
    onError: () => toast.error("Approval failed."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => onReject(id, reason),
    onSuccess: () => {
      toast.success("Request rejected.");
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setRejectId(null);
    },
    onError: () => toast.error("Rejection failed."),
  });

  if (items.length === 0) {
    return <EmptyState title={`No pending ${type === "crypto" ? "crypto" : "gift card"} requests`} />;
  }

  return (
    <>
      <div className="rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {type === "crypto" ? "Asset" : "Brand"}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {type === "crypto" ? "Crypto Amount" : "Card Value"}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">NGN Equivalent</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{item.userId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    {isCrypto(item) ? item.cryptoAsset : `${(item as GiftCardSellRequest).cardBrand} – ${(item as GiftCardSellRequest).cardType}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isCrypto(item)
                      ? `${item.cryptoAmount} ${item.cryptoAsset}`
                      : <Money amount={(item as GiftCardSellRequest).cardValue} />}
                  </td>
                  <td className="px-4 py-3 text-right"><Money amount={item.nairaEquivalent} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3"><DateTime value={item.createdAt} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(item)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {item.status === "PENDING" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => setApproveId(item.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => setRejectId(item.id)}
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
      </div>

      {/* Detail dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Detail</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">ID</p><p className="font-mono text-xs">{viewItem.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewItem.status} /></div>
                <div><p className="text-xs text-muted-foreground">User ID</p><p className="font-mono text-xs">{viewItem.userId}</p></div>
                <div><p className="text-xs text-muted-foreground">NGN Equivalent</p><Money amount={viewItem.nairaEquivalent} /></div>
                {viewItem.reviewedAt && <div><p className="text-xs text-muted-foreground">Reviewed</p><DateTime value={viewItem.reviewedAt} /></div>}
                {viewItem.adminNote && <div className="col-span-2"><p className="text-xs text-muted-foreground">Admin Note</p><p>{viewItem.adminNote}</p></div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve confirm */}
      <ConfirmActionDialog
        open={!!approveId}
        title="Approve Request"
        description="Are you sure you want to approve this exchange request? This will credit the user's wallet."
        confirmLabel="Approve"
        variant="default"
        onConfirm={() => approveId && approveMutation.mutate(approveId)}
        onCancel={() => setApproveId(null)}
        loading={approveMutation.isPending}
      />

      {/* Reject confirm */}
      <ConfirmActionDialog
        open={!!rejectId}
        title="Reject Request"
        description="Rejecting this request will notify the user. Please provide a reason."
        confirmLabel="Reject"
        variant="danger"
        requireReason
        reasonLabel="Rejection reason (required)"
        onConfirm={(reason) => rejectId && rejectMutation.mutate({ id: rejectId, reason: reason ?? "" })}
        onCancel={() => setRejectId(null)}
        loading={rejectMutation.isPending}
      />
    </>
  );
}
