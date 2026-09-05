import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { DEFAULT_PAGE_LIMIT } from "@/lib/constants";

export function usePagination(defaultLimit = DEFAULT_PAGE_LIMIT) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? String(defaultLimit), 10);

  const setPage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", String(nextLimit));
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return { page, limit, setPage, setLimit };
}
