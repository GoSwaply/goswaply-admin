"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { DateTime } from "@/components/common/DateTime";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";
import { JsonViewer } from "@/components/common/JsonViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { AUDIT_LOG_NOTICE } from "@/lib/constants";
import type { AuditLog } from "@/types";

export default function AuditLogPage() {
  const { page, limit, setPage } = usePagination(25);
  const [search, setSearch] = useState("");
  const [viewLog, setViewLog] = useState<AuditLog | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.auditLogs({ page, limit, action: debouncedSearch }),
    queryFn: () =>
      adminApi.getAuditLogs({ page, limit, action: debouncedSearch || undefined }),
  });

  const logs = data?.data ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Audit Log" description="Immutable record of admin actions." />

      <PrivacyNotice message={AUDIT_LOG_NOTICE} />

      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Filter by action..." />

      {isLoading && <TableSkeleton rows={10} cols={6} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          {logs.length === 0 ? (
            <EmptyState title="No audit entries match your filters" />
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resource</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3"><DateTime value={log.createdAt} /></td>
                      <td className="px-4 py-3 font-mono text-xs">{log.adminId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.resource}</span>
                        {log.resourceId && <span className="ml-1 text-xs text-muted-foreground font-mono">{log.resourceId.slice(0, 8)}…</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.ipAddress ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {(log.payloadBefore || log.payloadAfter) && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setViewLog(log)}>
                            View Diff
                          </Button>
                        )}
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

      <Dialog open={!!viewLog} onOpenChange={() => setViewLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Audit Diff — {viewLog?.action}</DialogTitle></DialogHeader>
          {viewLog && (
            <div className="space-y-3">
              {viewLog.payloadBefore && <JsonViewer data={viewLog.payloadBefore} label="Before" defaultExpanded />}
              {viewLog.payloadAfter && <JsonViewer data={viewLog.payloadAfter} label="After" defaultExpanded />}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
