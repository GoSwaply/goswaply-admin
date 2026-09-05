"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { RoleGate } from "@/components/rbac/RoleGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { billerPricingSchema, type BillerPricingInput } from "@/schemas/config.schema";
import { formatMoney, formatPercent } from "@/lib/formatters";
import { toast } from "sonner";
import type { BillerPricing } from "@/types";

export default function BillerPricingPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BillerPricing | null>(null);

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.billerPricing(),
    queryFn: adminApi.listBillerPricing,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createBillerPricing,
    onSuccess: () => { toast.success("Biller pricing added."); queryClient.invalidateQueries({ queryKey: QueryKeys.billerPricing() }); setShowForm(false); },
    onError: () => toast.error("Failed to add biller pricing."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillerPricing> }) => adminApi.updateBillerPricing(id, data),
    onSuccess: () => { toast.success("Biller pricing updated."); queryClient.invalidateQueries({ queryKey: QueryKeys.billerPricing() }); setEditItem(null); },
    onError: () => toast.error("Failed to update biller pricing."),
  });

  const form = useForm<BillerPricingInput>({
    resolver: zodResolver(billerPricingSchema),
    defaultValues: { billerId: "", billerName: "", commissionType: "PERCENTAGE", commissionValue: 0 },
  });

  const onSubmit = (values: BillerPricingInput) => {
    if (editItem) updateMutation.mutate({ id: editItem.billerId, data: values });
    else createMutation.mutate(values as Omit<BillerPricing, "id" | "createdAt" | "updatedAt">);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Biller Pricing"
        description={`${data.length} biller${data.length !== 1 ? "s" : ""} configured`}
        actions={
          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button size="sm" onClick={() => { form.reset(); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Add Biller
            </Button>
          </RoleGate>
        }
      />

      {isLoading && <TableSkeleton rows={6} cols={5} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        data.length === 0 ? (
          <EmptyState title="No biller pricing configured" />
        ) : (
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Biller</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Biller ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Commission Type</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((b: BillerPricing) => (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{b.billerName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.billerId}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{b.commissionType}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {b.commissionType === "PERCENTAGE" ? formatPercent(b.commissionValue) : formatMoney(b.commissionValue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RoleGate allow={["SUPER_ADMIN"]}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(b); form.reset(b); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </RoleGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Dialog open={showForm || !!editItem} onOpenChange={() => { setShowForm(false); setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "Edit Biller Pricing" : "Add Biller Pricing"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Biller ID</Label>
                <Input {...form.register("billerId")} placeholder="e.g. MTN-DATA" />
                {form.formState.errors.billerId && <p className="text-xs text-destructive">{form.formState.errors.billerId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Biller Name</Label>
                <Input {...form.register("billerName")} placeholder="e.g. MTN Data" />
                {form.formState.errors.billerName && <p className="text-xs text-destructive">{form.formState.errors.billerName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Commission Type</Label>
                <Select value={form.watch("commissionType")} onValueChange={(v) => form.setValue("commissionType", v as "PERCENTAGE" | "FLAT")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FLAT">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Commission Value</Label>
                <Input type="number" step="0.01" {...form.register("commissionValue", { valueAsNumber: true })} />
                {form.formState.errors.commissionValue && <p className="text-xs text-destructive">{form.formState.errors.commissionValue.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editItem ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
