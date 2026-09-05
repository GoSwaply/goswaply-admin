import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivacyNoticeProps {
  message: string;
  className?: string;
}

export function PrivacyNotice({ message, className }: PrivacyNoticeProps) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900", className)}>
      <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
      <p className="text-xs leading-relaxed">{message}</p>
    </div>
  );
}
