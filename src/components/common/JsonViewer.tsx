"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { safeJsonStringify } from "@/lib/redaction";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: unknown;
  defaultExpanded?: boolean;
  label?: string;
  maxHeight?: string;
  className?: string;
}

export function JsonViewer({
  data,
  defaultExpanded = false,
  label = "Payload",
  maxHeight = "320px",
  className,
}: JsonViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const redacted = safeJsonStringify(data);

  return (
    <div className={cn("rounded-md border", className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        aria-expanded={expanded}
      >
        <span>{label}</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {expanded && (
        <ScrollArea style={{ maxHeight }} className="border-t">
          <pre className="p-3 text-xs font-mono leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
            {redacted}
          </pre>
        </ScrollArea>
      )}
    </div>
  );
}
