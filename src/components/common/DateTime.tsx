import { formatDateTime, formatDate } from "@/lib/formatters";

interface DateTimeProps {
  value: string | null | undefined;
  dateOnly?: boolean;
}

export function DateTime({ value, dateOnly }: DateTimeProps) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <time dateTime={value} className="text-sm tabular-nums">
      {dateOnly ? formatDate(value) : formatDateTime(value)}
    </time>
  );
}
