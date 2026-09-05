"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateTime } from "@/components/common/DateTime";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { RoleGate } from "@/components/rbac/RoleGate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";
import { complianceCaseSchema, type ComplianceCaseInput } from "@/schemas/compliance.schema";
import { COMPLIANCE_CASE_NOTICE } from "@/lib/constants";
import { usePagination } from "@/hooks/use-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import type { ComplianceCase } from "@/types";

export default function ComplianceCasesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { page, limit, setPage } = usePagination();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchUser, setSearchUser] = useState("");
  const debouncedUser = useDebounce(searchUser, 400);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.cases({ page, limit, status: statusFilter, userId: debouncedUser }),
    queryFn: () =>
      adminApi.listCases({ page, limit, status: statusFilter !== "all" ? statusFilter : undefined, userId: debouncedUser || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createCase,
    onSuccess: (newCase) => {
      toast.success("Compliance case created.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.cases() });
      setShowCreate(false);
      router.push(`/compliance/cases/${newCase.id}`);
    },
    onError: () => toast.error("Failed to create case."),
  });

  const form = useForm<ComplianceCaseInput>({
    resolver: zodResolver(complianceCaseSchema),
  });

  const cases = data?.data ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Compliance Cases"
        description={`${data?.total ?? 0} case${data?.total !== 1 ? "s" : ""}`}
        actions={
          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> New Case
            </Button>
          </RoleGate>
        }
      />

      <PrivacyNotice message={COMPLIANCE_CASE_NOTICE} />

      <FilterBar search={searchUser} onSearchChange={setSearchUser} searchPlaceholder="Search by user ID...">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {["OPEN", "INVESTIGATING", "FUNDS_FROZEN", "RESOLVED", "CLOSED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {isLoading && <TableSkeleton rows={8} cols={6} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          {cases.length === 0 ? (
            <EmptyState title="No compliance cases found" />
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Case ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cases.map((c: ComplianceCase) => (
                    <tr key={c.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => router.push(`/compliance/cases/${c.id}`)}>
                      <td className="px-4 py-3 font-mono text-xs">{c.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.userId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{c.flagReason}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3"><DateTime value={c.createdAt} /></td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/compliance/cases/${c.id}`); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open Compliance Case</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>User ID</Label>
              <Input {...form.register("userId")} placeholder="User UUID" />
              {form.formState.errors.userId && <p className="text-xs text-destructive">{form.formState.errors.userId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Transaction ID (optional)</Label>
              <Input {...form.register("transactionId")} placeholder="Transaction UUID" />
            </div>
            <div className="space-y-1.5">
              <Label>Flag Reason</Label>
              <Textarea {...form.register("flagReason")} rows={3} placeholder="Describe the suspected issue..." />
              {form.formState.errors.flagReason && <p className="text-xs text-destructive">{form.formState.errors.flagReason.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Open Case</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
