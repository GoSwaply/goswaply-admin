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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { DateTime } from "@/components/common/DateTime";
import { RoleGate } from "@/components/rbac/RoleGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { bannerSchema, type BannerInput } from "@/schemas/system.schema";
import { toast } from "sonner";
import type { AppBanner } from "@/types";

const BANNER_TYPE_COLORS: Record<string, string> = {
  INFO: "pending",
  WARNING: "warning",
  ERROR: "destructive",
  PROMO: "success",
};

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<AppBanner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.banners(),
    queryFn: adminApi.listBanners,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createBanner,
    onSuccess: () => { toast.success("Banner created."); queryClient.invalidateQueries({ queryKey: QueryKeys.banners() }); setShowForm(false); },
    onError: () => toast.error("Failed to create banner."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppBanner> }) => adminApi.updateBanner(id, data),
    onSuccess: () => { toast.success("Banner updated."); queryClient.invalidateQueries({ queryKey: QueryKeys.banners() }); setEditItem(null); },
    onError: () => toast.error("Failed to update banner."),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteBanner,
    onSuccess: () => { toast.success("Banner deleted."); queryClient.invalidateQueries({ queryKey: QueryKeys.banners() }); setDeleteId(null); },
    onError: () => toast.error("Failed to delete banner."),
  });

  const form = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { title: "", message: "", type: "INFO", isActive: true, expiresAt: null },
  });

  const onSubmit = (values: BannerInput) => {
    if (editItem) updateMutation.mutate({ id: editItem.id, data: values });
    else createMutation.mutate(values as Omit<AppBanner, "id" | "createdAt" | "updatedAt">);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="App Banners"
        description={`${data.length} banner${data.length !== 1 ? "s" : ""}`}
        actions={
          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button size="sm" onClick={() => { form.reset(); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Create Banner
            </Button>
          </RoleGate>
        }
      />

      {isLoading && <TableSkeleton rows={4} cols={5} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        data.length === 0 ? (
          <EmptyState title="No banners configured" />
        ) : (
          <div className="grid gap-4">
            {data.map((b: AppBanner) => (
              <div key={b.id} className="rounded-2xl border p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={BANNER_TYPE_COLORS[b.type] as "pending" | "warning" | "destructive" | "success"} className="text-xs">{b.type}</Badge>
                    <StatusBadge status={b.isActive ? "ACTIVE" : "INACTIVE"} />
                  </div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{b.message}</p>
                  {b.expiresAt && <p className="text-xs text-muted-foreground mt-1">Expires: <DateTime value={b.expiresAt} /></p>}
                </div>
                <RoleGate allow={["SUPER_ADMIN"]}>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(b); form.reset(b as unknown as BannerInput); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </RoleGate>
              </div>
            ))}
          </div>
        )
      )}

      <Dialog open={showForm || !!editItem} onOpenChange={() => { setShowForm(false); setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "Edit Banner" : "Create Banner"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input {...form.register("title")} placeholder="Banner headline" />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea {...form.register("message")} rows={3} placeholder="Banner body text" />
              {form.formState.errors.message && <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as BannerInput["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["INFO", "WARNING", "ERROR", "PROMO"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expires At (optional)</Label>
                <Input type="datetime-local" {...form.register("expiresAt")} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="banner-active" checked={form.watch("isActive")} onCheckedChange={(v) => form.setValue("isActive", v)} />
              <Label htmlFor="banner-active">Active</Label>
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
        title="Delete Banner"
        description="This will permanently remove the banner from the platform."
        confirmLabel="Delete Banner"
        variant="danger"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
