"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import type { CryptoDirection, CryptoReviewRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateTime } from "@/components/common/DateTime";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Money } from "@/components/common/Money";

function amount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ReceiptPreview({ id }: { id: string }) {
  const { data: blob, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.cryptoReceipt(id),
    queryFn: () => adminApi.cryptoReceipt(id),
  });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading receipt…</p>;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!url) return <p className="text-sm text-muted-foreground">Receipt unavailable.</p>;
  return <img src={url} alt="Customer payment receipt" className="max-h-[55vh] w-full rounded-lg border object-contain" />;
}

function Detail({ item }: { item: CryptoReviewRequest }) {
  const quote = amount(item.rateAtSubmission);
  const nairaValue = amount(item.nairaValue);
  const paymentAmount = amount(item.paymentAmountNaira);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Direction" value={item.direction} />
        <Info label="Status" value={<StatusBadge status={item.status} />} />
        <Info label="Asset / amount" value={`${item.coinName} (${item.currency}) · ${amount(item.amount) ?? "—"}`} />
        <Info label="Network" value={item.network || "—"} />
        <Info label="Reference" value={item.reference} mono />
        <Info label="Submitted" value={<DateTime value={item.createdAt} />} />
        <Info label="Customer payment reference" value={item.paymentReference || "—"} mono wide />
        <Info label="Customer crypto transaction hash" value={item.cryptoTransactionHash || "—"} mono wide />
        <Info label="User wallet address" value={item.walletAddress || "—"} mono wide />
        <Info label="Payout account name" value={item.payoutAccountName || "—"} />
        <Info label="Payout account number" value={item.payoutAccountNumber || "—"} mono />
        <Info label="Payout bank" value={item.payoutBankName || "—"} />
        <Info label="Buy payment amount" value={paymentAmount !== null ? <Money amount={paymentAmount} /> : "—"} />
        <Info label="Quoted rate" value={quote !== null ? quote.toLocaleString() : "—"} />
        <Info label="Naira value" value={nairaValue !== null ? <Money amount={nairaValue} /> : "—"} />
        <Info label="Margin" value={item.marginPercent !== null ? `${item.marginPercent}%` : "—"} />
        <Info label="Fulfillment reference" value={item.fulfillmentReference || "—"} mono wide />
        <Info label="Payout reference" value={item.payoutReference || "—"} mono wide />
      </div>
      {item.receiptKey ? (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Payment receipt</h3>
          <ReceiptPreview id={item.id} />
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">No payment receipt is attached.</p>
      )}
    </div>
  );
}

function Info({ label, value, mono, wide }: { label: string; value: React.ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={mono ? "break-all font-mono text-xs" : "break-words"}>{value}</p>
    </div>
  );
}

export function CryptoReviewQueue({ direction }: { direction: CryptoDirection }) {
  const queryClient = useQueryClient();
  const queueKey = QueryKeys.cryptoPending(direction);
  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queueKey,
    queryFn: () => adminApi.cryptoPending(direction),
    refetchInterval: 30_000,
  });
  const [selected, setSelected] = useState<CryptoReviewRequest | null>(null);
  const [approving, setApproving] = useState<CryptoReviewRequest | null>(null);
  const [rejecting, setRejecting] = useState<CryptoReviewRequest | null>(null);
  const [fulfillmentReference, setFulfillmentReference] = useState("");
  const [reason, setReason] = useState("");

  const approve = useMutation({
    mutationFn: ({ id, reference }: { id: string; reference: string }) =>
      adminApi.approveCrypto(id, { fulfillmentReference: reference }),
    onSuccess: () => {
      toast.success(`${direction} request approved.`);
      queryClient.invalidateQueries({ queryKey: queueKey });
      setApproving(null);
      setFulfillmentReference("");
    },
    onError: (e: Error) => toast.error(e.message || "Approval failed."),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason: rejectionReason }: { id: string; reason: string }) =>
      adminApi.rejectCrypto(id, { reason: rejectionReason }),
    onSuccess: () => {
      toast.success(`${direction} request rejected.`);
      queryClient.invalidateQueries({ queryKey: queueKey });
      setRejecting(null);
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message || "Rejection failed."),
  });

  return (
    <>
      {isLoading && <TableSkeleton rows={5} cols={7} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !isError && data.length === 0 && <EmptyState title={`No pending ${direction.toLowerCase()} requests`} />}
      {!isLoading && !isError && data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Asset / amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Wallet address</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bank details</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{direction === "BUY" ? "Payment" : "Payout"}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((item) => {
                  const value = amount(direction === "BUY" ? item.paymentAmountNaira : item.nairaValue);
                  return (
                    <tr key={item.id} className="align-top hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.iconUrl && <img src={item.iconUrl} alt="" className="h-7 w-7 rounded-full object-cover" />}
                          <span><span className="block font-medium">{item.coinName} ({item.currency})</span><span className="text-xs text-muted-foreground">{amount(item.amount) ?? "—"} · {item.network}</span></span>
                        </div>
                      </td>
                      <td className="max-w-56 px-4 py-3 font-mono text-xs break-all">{item.walletAddress || "—"}</td>
                      <td className="px-4 py-3 text-xs">
                        {item.payoutAccountName || item.payoutAccountNumber || item.payoutBankName ? (
                          <span>{item.payoutAccountName || "—"}<br />{item.payoutAccountNumber || "—"}<br />{item.payoutBankName || "—"}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">{value !== null ? <Money amount={value} /> : "—"}</td>
                      <td className="px-4 py-3"><DateTime value={item.createdAt} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="View request details" onClick={() => setSelected(item)}><Eye className="h-4 w-4" /></Button>
                          {item.status === "PENDING" && <>
                            <Button variant="ghost" size="icon" aria-label="Approve request" className="text-green-700" onClick={() => { setApproving(item); setFulfillmentReference(""); }}><CheckCircle2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" aria-label="Reject request" className="text-destructive" onClick={() => { setRejecting(item); setReason(""); }}><XCircle className="h-4 w-4" /></Button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Crypto {direction} request</DialogTitle></DialogHeader>
          {selected && <Detail item={selected} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!approving} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve {direction.toLowerCase()} request</DialogTitle></DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault();
            const reference = fulfillmentReference.trim();
            if (approving && reference) approve.mutate({ id: approving.id, reference });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crypto-fulfillment-reference">Manual fulfillment reference</Label>
              <Input id="crypto-fulfillment-reference" value={fulfillmentReference} onChange={(event) => setFulfillmentReference(event.target.value)} required autoComplete="off" />
              <p className="text-xs text-muted-foreground">Record the transaction or operational reference used to fulfill this request.</p>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setApproving(null)}>Cancel</Button><Button type="submit" disabled={!fulfillmentReference.trim() || approve.isPending}>{approve.isPending ? "Approving…" : "Approve request"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {direction.toLowerCase()} request</DialogTitle></DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault();
            const rejectionReason = reason.trim();
            if (rejecting && rejectionReason) reject.mutate({ id: rejecting.id, reason: rejectionReason });
          }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="crypto-rejection-reason">Reason</Label><Textarea id="crypto-rejection-reason" value={reason} onChange={(event) => setReason(event.target.value)} required minLength={3} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setRejecting(null)}>Cancel</Button><Button type="submit" variant="destructive" disabled={reason.trim().length < 3 || reject.isPending}>{reject.isPending ? "Rejecting…" : "Reject request"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
