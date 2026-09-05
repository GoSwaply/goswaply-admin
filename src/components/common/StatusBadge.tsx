import { Badge } from "@/components/ui/badge";
import { formatStatusLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const STATUS_VARIANT_MAP: Record<string, string> = {
  SUCCESS: "success",
  ACTIVE: "success",
  APPROVED: "success",
  UP: "success",
  PROCESSED: "success",
  OPEN: "pending",
  PENDING: "pending",
  RECEIVED: "pending",
  REPROCESSING: "pending",
  INVESTIGATING: "warning",
  FUNDS_FROZEN: "warning",
  DEGRADED: "warning",
  FAILED: "destructive",
  REJECTED: "destructive",
  DOWN: "destructive",
  CLOSED: "muted",
  RESOLVED: "muted",
  INACTIVE: "muted",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANT_MAP[status] ?? "secondary";
  return (
    <Badge variant={variant as "success" | "warning" | "destructive" | "muted" | "pending" | "default" | "secondary" | "outline"} className={cn("font-medium", className)}>
      {formatStatusLabel(status)}
    </Badge>
  );
}
