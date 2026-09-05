"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { feeRuleSchema, type FeeRuleInput } from "@/schemas/config.schema";
import { formatMoney, formatPercent } from "@/lib/formatters";
import { toast } from "sonner";
import type { FeeRule } from "@/types";

export default function FeeRulesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<FeeRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.feeRules(),
    queryFn: adminApi.listFeeRules,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createFeeRule,
    onSuccess: () => { toast.success("Fee rule created."); queryClient.invalidateQueries({ queryKey: QueryKeys.feeRules() }); setShowForm(false); },
    onError: () => toast.error("Failed to create fee rule."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeeRule> }) => adminApi.updateFeeRule(id, data),
    onSuccess: () => { toast.success("Fee rule updated."); queryClient.invalidateQueries({ queryKey: QueryKeys.feeRules() }); setEditItem(null); },
    onError: () => toast.error("Failed to update fee rule."),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteFeeRule,
    onSuccess: () => { toast.success("Fee rule deleted."); queryClient.invalidateQueries({ queryKey: QueryKeys.feeRules() }); setDeleteId(null); },
    onError: () => toast.error("Failed to delete fee rule."),
  });

  const form = useForm<FeeRuleInput>({
    resolver: zodResolver(feeRuleSchema),
    defaultValues: { name: "", scope: "GLOBAL", scopeValue: "all", feeType: "FLAT", percentageFee: null, flatFee: 0, isActive: true },
  });

  const onSubmit = (values: FeeRuleInput) => {
    if (editItem) updateMutation.mutate({ id: editItem.id, data: values });
    else createMutation.mutate(values as Omit<FeeRule, "id" | "createdAt" | "updatedAt">);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Fee Rules"
        description={`${data.length} rule${data.length !== 1 ? "s" : ""}`}
        actions={
          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button size="sm" onClick={() => { form.reset({ name: "", scope: "GLOBAL", scopeValue: "all", feeType: "FLAT", percentageFee: null, flatFee: 0, isActive: true }); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> New Rule
            </Button>
          </RoleGate>
        }
      />

      {isLoading && <TableSkeleton rows={6} cols={7} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        data.length === 0 ? (
          <EmptyState title="No fee rules configured" />
        ) : (
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scope</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">% Fee</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Flat Fee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((rule: FeeRule) => (
                  <tr key={rule.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3"><p className="font-medium">{rule.name}</p></td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{rule.scope}</Badge><span className="ml-1 text-xs text-muted-foreground">{rule.scopeValue}</span></td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{rule.feeType}</Badge></td>
                    <td className="px-4 py-3 text-right">{rule.percentageFee !== null ? formatPercent(rule.percentageFee) : "—"}</td>
                    <td className="px-4 py-3 text-right">{rule.flatFee !== null ? formatMoney(rule.flatFee) : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={rule.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                    <td className="px-4 py-3 text-right">
                      <RoleGate allow={["SUPER_ADMIN"]}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(rule); form.reset(rule as unknown as FeeRuleInput); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(rule.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
          <DialogHeader><DialogTitle>{editItem ? "Edit Fee Rule" : "New Fee Rule"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Scope</Label>
                <Select value={form.watch("scope")} onValueChange={(v) => form.setValue("scope", v as FeeRuleInput["scope"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["GLOBAL", "USER", "TRANSACTION_TYPE", "BILLER"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Scope Value</Label>
                <Input {...form.register("scopeValue")} placeholder="e.g. all, userId, VAS_PAYMENT" />
                {form.formState.errors.scopeValue && <p className="text-xs text-destructive">{form.formState.errors.scopeValue.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Fee Type</Label>
                <Select value={form.watch("feeType")} onValueChange={(v) => form.setValue("feeType", v as FeeRuleInput["feeType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["PERCENTAGE", "FLAT", "PERCENTAGE_AND_FLAT"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Percentage Fee (%)</Label>
                <Input type="number" step="0.01" {...form.register("percentageFee", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Flat Fee (NGN)</Label>
                <Input type="number" step="0.01" {...form.register("flatFee", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="fee-active" checked={form.watch("isActive")} onCheckedChange={(v) => form.setValue("isActive", v)} />
              <Label htmlFor="fee-active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editItem ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={!!deleteId}
        title="Delete Fee Rule"
        description="This will permanently remove the fee rule."
        variant="danger"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
