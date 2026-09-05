"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fraudRuleSchema, type FraudRuleInput } from "@/schemas/compliance.schema";
import { toast } from "sonner";
import type { FraudRule } from "@/types";

export default function FraudRulesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<FraudRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.fraudRules(),
    queryFn: adminApi.listFraudRules,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createFraudRule,
    onSuccess: () => {
      toast.success("Fraud rule created.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.fraudRules() });
      setShowForm(false);
    },
    onError: () => toast.error("Failed to create fraud rule."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FraudRule> }) =>
      adminApi.updateFraudRule(id, data),
    onSuccess: () => {
      toast.success("Fraud rule updated.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.fraudRules() });
      setEditItem(null);
    },
    onError: () => toast.error("Failed to update fraud rule."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFraudRule(id),
    onSuccess: () => {
      toast.success("Fraud rule removed.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.fraudRules() });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to remove fraud rule."),
  });

  const filtered = data.filter((r: FraudRule) => {
    if (activeFilter === "ACTIVE") return r.isActive;
    if (activeFilter === "INACTIVE") return !r.isActive;
    return true;
  });

  const form = useForm<FraudRuleInput>({
    resolver: zodResolver(fraudRuleSchema),
    defaultValues: editItem
      ? { name: editItem.name, description: editItem.description ?? undefined, ruleType: editItem.ruleType, threshold: editItem.threshold, action: editItem.action, isActive: editItem.isActive }
      : { name: "", ruleType: "VELOCITY", threshold: 1, action: "FLAG", isActive: true },
  });

  const onSubmit: SubmitHandler<FraudRuleInput> = (values) => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: values });
    } else {
      createMutation.mutate(values as Omit<FraudRule, "id" | "createdAt" | "updatedAt">);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Fraud Rules"
        description={`${data.length} rule${data.length !== 1 ? "s" : ""} configured`}
        actions={
          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button size="sm" onClick={() => { form.reset({ name: "", ruleType: "VELOCITY", threshold: 1, action: "FLAG", isActive: true }); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> New Rule
            </Button>
          </RoleGate>
        }
      />

      <div className="flex gap-2">
        {(["ALL", "ACTIVE", "INACTIVE"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={activeFilter === f ? "default" : "outline"}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading && <TableSkeleton rows={6} cols={6} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          {filtered.length === 0 ? (
            <EmptyState title="No fraud rules found" />
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Threshold</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((rule: FraudRule) => (
                    <tr key={rule.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{rule.ruleType}</Badge></td>
                      <td className="px-4 py-3 text-right font-mono">{rule.threshold}</td>
                      <td className="px-4 py-3"><Badge variant={rule.action === "BLOCK" ? "destructive" : "warning"} className="text-xs">{rule.action}</Badge></td>
                      <td className="px-4 py-3"><StatusBadge status={rule.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                      <td className="px-4 py-3 text-right">
                        <RoleGate allow={["SUPER_ADMIN"]}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(rule); form.reset({ ...rule, description: rule.description ?? undefined }); }}>
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
          )}
        </>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={showForm || !!editItem} onOpenChange={() => { setShowForm(false); setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "Edit Fraud Rule" : "New Fraud Rule"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Rule name" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...form.register("description")} rows={2} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rule Type</Label>
                <Select value={form.watch("ruleType")} onValueChange={(v) => form.setValue("ruleType", v as FraudRuleInput["ruleType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["VELOCITY", "AMOUNT_LIMIT", "FREQUENCY", "PATTERN", "BLACKLIST", "DEVICE"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Action</Label>
                <Select value={form.watch("action")} onValueChange={(v) => form.setValue("action", v as FraudRuleInput["action"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["BLOCK", "FLAG", "ALERT", "REVIEW"].map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Threshold</Label>
              <Input type="number" {...form.register("threshold", { valueAsNumber: true })} />
              {form.formState.errors.threshold && <p className="text-xs text-destructive">{form.formState.errors.threshold.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="rule-active"
                checked={form.watch("isActive")}
                onCheckedChange={(v) => form.setValue("isActive", v)}
              />
              <Label htmlFor="rule-active">Active</Label>
            </div>
            {form.watch("action") === "BLOCK" && (
              <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                This rule will automatically BLOCK transactions. Verify the threshold is correct before saving.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editItem ? "Save Changes" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={!!deleteId}
        title="Delete Fraud Rule"
        description="Are you sure you want to remove this fraud rule?"
        consequence="This may affect transaction monitoring coverage."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
