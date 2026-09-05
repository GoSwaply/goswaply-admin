"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateTime } from "@/components/common/DateTime";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { maskEmail, maskPhone } from "@/lib/formatters";
import type { UserListItem } from "@/types";

export default function UsersPage() {
  const router = useRouter();
  const { page, limit, setPage } = usePagination(20);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.users({ page, limit, search: debouncedSearch, role: roleFilter, isActive: activeFilter }),
    queryFn: () =>
      adminApi.listUsers({
        page,
        limit,
        search: debouncedSearch || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        isActive: activeFilter !== "all" ? activeFilter === "true" : undefined,
      }),
  });

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Users" description={`${data?.total ?? 0} registered users`} />

      <div className="flex flex-wrap gap-2">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search email or phone..."
        >
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>
      </div>

      {isLoading && <TableSkeleton rows={10} cols={8} />}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {users.length === 0 ? (
            <EmptyState title="No users found" description="Try adjusting your search or filters." />
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user: UserListItem) => (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium truncate max-w-[160px]">{maskEmail(user.email)}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}…</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{maskPhone(user.phoneNumber)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} />
                        </td>
                        <td className="px-4 py-3">
                          {user.isEmailVerified ? (
                            <Badge variant="success" className="text-xs">Verified</Badge>
                          ) : (
                            <Badge variant="muted" className="text-xs">Unverified</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {user.isPhoneVerified ? (
                            <Badge variant="success" className="text-xs">Verified</Badge>
                          ) : (
                            <Badge variant="muted" className="text-xs">Unverified</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <DateTime value={user.createdAt} dateOnly />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="User actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
                                <Eye className="h-4 w-4 mr-2" /> View Profile
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 border-t">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
