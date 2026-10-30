"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Terminal,
  Download,
  Search,
  ArrowDown,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { cn } from "@/lib/utils";
import { req } from "@/lib/api/client";
import type { LogSource, LogTailResult } from "@/types";

const LINE_OPTIONS = [100, 250, 500, 1000, 2000];
const REFETCH_INTERVAL = 10_000;

export default function ServerLogsPage() {
  const [source, setSource] = useState<string>("");
  const [lines, setLines] = useState(250);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const logRef = useRef<HTMLPreElement>(null);

  const {
    data: sources,
    isLoading: sourcesLoading,
    isError: sourcesError,
    error: sourcesErr,
    refetch: refetchSources,
  } = useQuery({
    queryKey: QueryKeys.logSources(),
    queryFn: adminApi.logSources,
  });

  useEffect(() => {
    if (sources?.length && !source) {
      const first = sources.find((s) => s.exists);
      if (first) setSource(first.name);
    }
  }, [sources, source]);

  const {
    data: logData,
    isLoading: logLoading,
    isError: logError,
    error: logErr,
    refetch: refetchLog,
    isFetching: logFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: QueryKeys.logTail(source, { lines, search }),
    queryFn: () => adminApi.tailLog(source, { lines, search: search || undefined }),
    enabled: !!source,
    refetchInterval: REFETCH_INTERVAL,
  });

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logData, autoScroll]);

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
  }, [searchInput]);

  const handleDownload = useCallback(async () => {
    if (!source) return;
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (lines) qs.set("lines", String(lines));
    const qsStr = qs.toString();
    const path = `/api/v1/admin/logs/${source}/download${qsStr ? `?${qsStr}` : ""}`;
    const blob = await req<Blob>(path, { method: "GET" }, true, (res) => res.blob());
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${source}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }, [source, search, lines]);

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  const availableSources = sources?.filter((s) => s.exists) ?? [];
  const unavailableSources = sources?.filter((s) => !s.exists) ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Server Logs"
        description="View and search application log files in real time."
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={!source || logLoading}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchLog()}
              disabled={logFetching || !source}
            >
              <RefreshCw className={cn("h-4 w-4", logFetching && "animate-spin")} />
              {logFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        }
      />

      {sourcesLoading && <TableSkeleton rows={3} cols={4} />}
      {sourcesError && <ErrorState error={sourcesErr} onRetry={refetchSources} />}

      {!sourcesLoading && !sourcesError && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-52">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Log Source
              </label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map((s) => (
                    <SelectItem key={s.name} value={s.name}>
                      <span className="flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.name}
                        <span className="text-xs text-muted-foreground">({s.group})</span>
                      </span>
                    </SelectItem>
                  ))}
                  {unavailableSources.length > 0 && (
                    <>
                      <SelectItem value="__divider" disabled>
                        --- Unavailable ---
                      </SelectItem>
                      {unavailableSources.map((s) => (
                        <SelectItem key={s.name} value={s.name} disabled>
                          {s.name} (missing)
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="w-28">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Lines
              </label>
              <Select value={String(lines)} onValueChange={(v) => setLines(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Search
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Filter log lines..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <Button size="icon" variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Meta bar */}
          {logData && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {logData.returned.toLocaleString()} / {logData.totalLines.toLocaleString()} lines
              </span>
              <span>{(logData.fileSize / 1024).toFixed(1)} KB</span>
              {logData.warnings.length > 0 && (
                <span className="text-amber-600">
                  {logData.warnings.join(" · ")}
                </span>
              )}
              {dataUpdatedAt > 0 && (
                <span>
                  Updated {new Date(dataUpdatedAt).toLocaleTimeString()} · auto-refreshes every{" "}
                  {REFETCH_INTERVAL / 1000}s
                </span>
              )}
            </div>
          )}

          {/* Log output */}
          {logLoading && !logData && <TableSkeleton rows={8} cols={1} />}
          {logError && <ErrorState error={logErr} onRetry={refetchLog} />}

          {source && logData && (
            <Card className="relative">
              <CardContent className="p-0">
                <pre
                  ref={logRef}
                  className="overflow-auto max-h-[60vh] p-4 text-xs leading-relaxed font-mono bg-muted/30 rounded-lg whitespace-pre-wrap break-all"
                >
                  {logData.lines.length === 0 ? (
                    <span className="text-muted-foreground italic">
                      {search ? "No lines match the search filter." : "Log file is empty."}
                    </span>
                  ) : (
                    logData.lines.map((line, i) => (
                      <span key={i} className={cn("block hover:bg-muted/50", lineColor(line))}>
                        {line}
                        {"\n"}
                      </span>
                    ))
                  )}
                </pre>
              </CardContent>

              {/* Scroll-to-bottom + auto-scroll toggle */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant={autoScroll ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => setAutoScroll(!autoScroll)}
                >
                  Auto-scroll {autoScroll ? "ON" : "OFF"}
                </Button>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={scrollToBottom}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}

          {!source && !sourcesLoading && (
            <div className="text-center py-16 text-sm text-muted-foreground">
              Select a log source to begin.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function lineColor(line: string): string {
  if (/\berror\b/i.test(line)) return "text-destructive";
  if (/\bwarn(ing)?\b/i.test(line)) return "text-amber-600 dark:text-amber-400";
  if (/\bdebug\b/i.test(line)) return "text-muted-foreground";
  return "";
}
