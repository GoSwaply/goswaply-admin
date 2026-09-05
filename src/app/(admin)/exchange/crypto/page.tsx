"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { ExchangeQueueTable } from "@/components/exchange/ExchangeQueueTable";

export default function CryptoQueuePage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.cryptoPending(),
    queryFn: () => adminApi.cryptoPending(),
    refetchInterval: 30_000,
  });

  const items = data?.data ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Crypto Exchange Queue"
        description={`${items.length} pending request${items.length !== 1 ? "s" : ""}`}
      />

      {isLoading && <TableSkeleton rows={6} cols={7} />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <ExchangeQueueTable
          items={items}
          type="crypto"
          onApprove={(id) => adminApi.approveCrypto(id)}
          onReject={(id, reason) => adminApi.rejectCrypto(id, { reason })}
          invalidateKey={QueryKeys.cryptoPending()}
        />
      )}
    </div>
  );
}
