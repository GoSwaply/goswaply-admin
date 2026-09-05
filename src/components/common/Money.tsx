import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface MoneyProps {
  amount: number | null | undefined;
  currency?: string;
  className?: string;
  rightAlign?: boolean;
}

export function Money({ amount, currency = "NGN", className, rightAlign }: MoneyProps) {
  return (
    <span className={cn("text-money text-sm", rightAlign && "block text-right", className)}>
      {formatMoney(amount, currency)}
    </span>
  );
}
