"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";

export default function TransactionsPage() {
  const { page, limit, setPage } = usePagination(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.transactions({ page, limit, search: debouncedSearch, status: statusFilter, type: typeFilter }),
    queryFn: () =>
      adminApi.listTransactions({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      }),
  });

  const transactions = data?.data ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Transactions" description={`${data?.total ?? 0} ledger entries`} />

      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search reference or user ID...">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="VAS_PAYMENT">VAS Payment</SelectItem>
            <SelectItem value="WALLET_FUNDING">Wallet Funding</SelectItem>
            <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
            <SelectItem value="CRYPTO_SELL">Crypto Sell</SelectItem>
            <SelectItem value="GIFT_CARD_SELL">Gift Card Sell</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {isLoading && <TableSkeleton rows={10} cols={9} />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {transactions.length === 0 ? (
            <EmptyState title="No transactions found" description="Try adjusting your filters." />
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <TransactionTable transactions={transactions} />
              <div className="px-4 border-t">
                <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} isLoading={isLoading} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
