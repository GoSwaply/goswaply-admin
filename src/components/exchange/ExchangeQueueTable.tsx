"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Money } from "@/components/common/Money";
import { DateTime } from "@/components/common/DateTime";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/formatters";
import { toast } from "sonner";
import { GIFT_CARD_FORMAT_LABELS } from "@/types";
import type { CryptoSellRequest, GiftCardSellRequest } from "@/types";

type ExchangeItem = CryptoSellRequest | GiftCardSellRequest;

interface ExchangeQueueTableProps {
  items: ExchangeItem[];
  type: "crypto" | "gift-card";
  /** Gift cards carry a payout the reviewer may override before approving. */
  onApprove: (id: string, nairaValue?: number) => Promise<unknown>;
  onReject: (id: string, reason: string) => Promise<unknown>;
  invalidateKey: readonly unknown[];
}

function isGiftCard(item: ExchangeItem): item is GiftCardSellRequest {
  return "cardType" in item;
}

/** Postgres returns decimal columns as strings. */
function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  const [approveItem, setApproveItem] = useState<ExchangeItem | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [payout, setPayout] = useState("");

  // Open the payout box on the figure the customer was already quoted, so the
  // common case is a glance and a click rather than retyping a number.
  useEffect(() => {
    if (!approveItem) return;
    const quoted = num(isGiftCard(approveItem) ? approveItem.nairaValue : approveItem.nairaValue);
    setPayout(quoted !== null ? String(quoted) : "");
  }, [approveItem]);

  const approveMutation = useMutation({
    mutationFn: ({ id, nairaValue }: { id: string; nairaValue?: number }) =>
      onApprove(id, nairaValue),
    onSuccess: () => {
      toast.success(`${type === "crypto" ? "Crypto" : "Gift card"} request approved.`);
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setApproveItem(null);
    },
    onError: (e: Error) => toast.error(e.message || "Approval failed."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => onReject(id, reason),
    onSuccess: () => {
      toast.success("Request rejected.");
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setRejectId(null);
    },
    onError: (e: Error) => toast.error(e.message || "Rejection failed."),
  });

  if (items.length === 0) {
    return <EmptyState title={`No pending ${type === "crypto" ? "crypto" : "gift card"} requests`} />;
  }

  /** The option the customer picked, as one readable line. */
  const quotedOption = (item: GiftCardSellRequest) => {
    if (!item.rateId) return null;
    const parts = [item.countryName, item.format ? GIFT_CARD_FORMAT_LABELS[item.format] : null];
    return parts.filter(Boolean).join(" · ");
  };

  const payoutNumber = Number(payout);
  const payoutValid = Number.isFinite(payoutNumber) && payoutNumber > 0;
  const approvingGiftCard = approveItem !== null && isGiftCard(approveItem);

  return (
    <>
      <div className="rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {type === "crypto" ? "Asset" : "Card"}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {type === "crypto" ? "Crypto Amount" : "Face Value"}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Payout</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const giftCard = isGiftCard(item) ? item : null;
                const option = giftCard ? quotedOption(giftCard) : null;
                const nairaValue = num(item.nairaValue);
                return (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{item.userId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      {giftCard ? (
                        <span className="block">
                          <span className="block">{giftCard.cardType}</span>
                          {option ? (
                            <span className="block text-xs text-muted-foreground">{option}</span>
                          ) : (
                            <span className="block text-xs text-amber-600">No rate selected</span>
                          )}
                        </span>
                      ) : (
                        (item as CryptoSellRequest).currency
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {giftCard
                        ? `${giftCard.currency ?? ""} ${num(giftCard.amount) ?? 0}`.trim()
                        : `${num(item.amount) ?? 0} ${(item as CryptoSellRequest).currency}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {nairaValue !== null ? (
                        <Money amount={nairaValue} />
                      ) : (
                        <span className="text-xs text-muted-foreground">To be priced</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3"><DateTime value={item.createdAt} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setViewItem(item)}
                          aria-label="View request"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {item.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setApproveItem(item)}
                              aria-label="Approve request"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => setRejectId(item.id)}
                              aria-label="Reject request"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Detail</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Reference</p>
                <p className="font-mono text-xs break-all">{viewItem.reference}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={viewItem.status} />
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="font-mono text-xs break-all">{viewItem.userId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payout</p>
                {num(viewItem.nairaValue) !== null ? (
                  <Money amount={num(viewItem.nairaValue)} />
                ) : (
                  <p className="text-xs text-muted-foreground">Not yet priced</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <DateTime value={viewItem.createdAt} />
              </div>

              {isGiftCard(viewItem) ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Card</p>
                    <p>{viewItem.cardType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Face Value</p>
                    <p className="tabular-nums">
                      {viewItem.currency ?? ""} {num(viewItem.amount) ?? 0}
                    </p>
                  </div>
                  {viewItem.rateId ? (
                    <div className="col-span-2 rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1">
                      <p className="text-xs text-muted-foreground">Quoted at submission</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{viewItem.countryName}</span>
                        {viewItem.format && (
                          <Badge variant="outline" className="text-[10px]">
                            {GIFT_CARD_FORMAT_LABELS[viewItem.format]}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          {formatMoney(num(viewItem.ratePerUnit))} per {viewItem.currency}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="col-span-2 text-xs text-amber-600">
                      Submitted without a rate — price this one by hand on approval.
                    </p>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Card image</p>
                    <p className="font-mono text-xs break-all">{viewItem.imageKey}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Asset</p>
                    <p>{viewItem.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="tabular-nums">{num(viewItem.amount) ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rate at submission</p>
                    <Money amount={num(viewItem.rateAtSubmission)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Margin</p>
                    <p className="tabular-nums">{num(viewItem.marginPercent) ?? 0}%</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve — gift cards need a payout, crypto already has one */}
      {approvingGiftCard ? (
        <Dialog open onOpenChange={() => setApproveItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve and pay out</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {approveItem && isGiftCard(approveItem) && (
                <p className="text-sm text-muted-foreground">
                  {approveItem.cardType}
                  {quotedOption(approveItem) ? ` · ${quotedOption(approveItem)}` : ""} ·{" "}
                  {approveItem.currency ?? ""} {num(approveItem.amount) ?? 0}
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Payout (NGN)</Label>
                <Input
                  id="approve-payout"
                  type="number"
                  step="0.01"
                  min={0}
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  {approveItem && isGiftCard(approveItem) && approveItem.rateId
                    ? "Pre-filled from the rate the customer was quoted. Change it only if the card differs from what they declared."
                    : "This submission carries no quoted rate, so the payout must be set here."}
                </p>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Approving credits the customer&apos;s wallet immediately. It cannot be undone here.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setApproveItem(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!payoutValid || approveMutation.isPending}
                onClick={() =>
                  approveItem &&
                  approveMutation.mutate({ id: approveItem.id, nairaValue: payoutNumber })
                }
              >
                Approve &amp; Credit {payoutValid ? formatMoney(payoutNumber) : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <ConfirmActionDialog
          open={!!approveItem}
          title="Approve Request"
          description="Approve this exchange request?"
          consequence="This credits the customer's wallet immediately."
          confirmLabel="Approve"
          variant="warning"
          onConfirm={() => approveItem && approveMutation.mutate({ id: approveItem.id })}
          onCancel={() => setApproveItem(null)}
          loading={approveMutation.isPending}
        />
      )}

      {/* Reject */}
      <ConfirmActionDialog
        open={!!rejectId}
        title="Reject Request"
        description="Rejecting this request records your reason against it. Say what was wrong, in words the customer could be shown."
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
