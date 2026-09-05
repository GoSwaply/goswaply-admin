"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Money } from "@/components/common/Money";
import { DateTime } from "@/components/common/DateTime";
import { JsonViewer } from "@/components/common/JsonViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Transaction } from "@/types";

interface TransactionTableProps {
  transactions: Transaction[];
  compact?: boolean;
}

export function TransactionTable({ transactions, compact }: TransactionTableProps) {
  const [viewTx, setViewTx] = useState<Transaction | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reference</th>
              {!compact && <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>}
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
              {!compact && <th className="px-4 py-3 text-right font-medium text-muted-foreground">Bal. Before</th>}
              {!compact && <th className="px-4 py-3 text-right font-medium text-muted-foreground">Bal. After</th>}
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{tx.reference}</td>
                {!compact && <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.userId.slice(0, 8)}…</td>}
                <td className="px-4 py-3">
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-medium">{tx.type.replace(/_/g, " ")}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                <td className="px-4 py-3 text-right"><Money amount={tx.amount} /></td>
                {!compact && <td className="px-4 py-3 text-right"><Money amount={tx.balanceBefore} /></td>}
                {!compact && <td className="px-4 py-3 text-right"><Money amount={tx.balanceAfter} /></td>}
                <td className="px-4 py-3"><DateTime value={tx.createdAt} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewTx(tx)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!viewTx} onOpenChange={() => setViewTx(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Detail</DialogTitle>
          </DialogHeader>
          {viewTx && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Reference</p><p className="font-mono">{viewTx.reference}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewTx.status} /></div>
                <div><p className="text-xs text-muted-foreground">Amount</p><Money amount={viewTx.amount} /></div>
                <div><p className="text-xs text-muted-foreground">Type</p><p>{viewTx.type}</p></div>
                <div><p className="text-xs text-muted-foreground">Balance Before</p><Money amount={viewTx.balanceBefore} /></div>
                <div><p className="text-xs text-muted-foreground">Balance After</p><Money amount={viewTx.balanceAfter} /></div>
                {viewTx.billerId && <div><p className="text-xs text-muted-foreground">Biller</p><p>{viewTx.billerId}</p></div>}
                {viewTx.profitEstimated !== null && <div><p className="text-xs text-muted-foreground">Est. Profit</p><Money amount={viewTx.profitEstimated} /></div>}
                <div><p className="text-xs text-muted-foreground">Created</p><DateTime value={viewTx.createdAt} /></div>
              </div>
              {viewTx.processorResponse && (
                <JsonViewer data={viewTx.processorResponse} label="Processor Response" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
