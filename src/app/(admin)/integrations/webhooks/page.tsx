"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Eye } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateTime } from "@/components/common/DateTime";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { JsonViewer } from "@/components/common/JsonViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleGate } from "@/components/rbac/RoleGate";
import { usePagination } from "@/hooks/use-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import type { WebhookEvent } from "@/types";

export default function WebhooksPage() {
  const { page, limit, setPage } = usePagination(20);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewEvent, setViewEvent] = useState<WebhookEvent | null>(null);
  const [reprocessId, setReprocessId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.webhookEvents({ page, limit, status: statusFilter, eventType: debouncedSearch }),
    queryFn: () =>
      adminApi.listWebhookEvents({
        page,
        limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
        eventType: debouncedSearch || undefined,
      }),
  });

  const reprocessMutation = useMutation({
    mutationFn: (id: string) => adminApi.reprocessWebhook(id),
    onSuccess: () => {
      toast.success("Webhook reprocess queued.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.webhookEvents() });
      setReprocessId(null);
    },
    onError: () => toast.error("Failed to reprocess webhook."),
  });

  const events = data?.data ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Webhook Events" description={`${data?.total ?? 0} events`} />

      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Filter by event type...">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {["RECEIVED", "PROCESSED", "FAILED", "REPROCESSING"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {isLoading && <TableSkeleton rows={8} cols={6} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          {events.length === 0 ? (
            <EmptyState title="No webhook events found" />
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Retries</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Received</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((ev: WebhookEvent) => (
                    <tr key={ev.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{ev.source}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs">{ev.eventType}</td>
                      <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                      <td className="px-4 py-3 text-right">{ev.retryCount}</td>
                      <td className="px-4 py-3"><DateTime value={ev.createdAt} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewEvent(ev)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {ev.status === "FAILED" && (
                            <RoleGate allow={["SUPER_ADMIN"]}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setReprocessId(ev.id)}
                                title="Reprocess"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            </RoleGate>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 border-t">
                <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} isLoading={isLoading} />
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={!!viewEvent} onOpenChange={() => setViewEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Webhook Event — {viewEvent?.eventType}</DialogTitle></DialogHeader>
          {viewEvent && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Source</p><p>{viewEvent.source}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={viewEvent.status} /></div>
                <div><p className="text-xs text-muted-foreground">Retries</p><p>{viewEvent.retryCount}</p></div>
                {viewEvent.errorMessage && <div className="col-span-2"><p className="text-xs text-muted-foreground">Error</p><p className="text-destructive text-sm">{viewEvent.errorMessage}</p></div>}
              </div>
              <JsonViewer data={viewEvent.payload} label="Payload" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={!!reprocessId}
        title="Reprocess Webhook"
        description="This will re-queue the failed webhook event for processing."
        consequence="The event handler will run again. Verify idempotency before proceeding."
        confirmLabel="Reprocess"
        variant="warning"
        onConfirm={() => reprocessId && reprocessMutation.mutate(reprocessId)}
        onCancel={() => setReprocessId(null)}
        loading={reprocessMutation.isPending}
      />
    </div>
  );
}
