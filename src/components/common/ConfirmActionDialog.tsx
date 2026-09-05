"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  consequence?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "warning" | "danger";
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  consequence,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  requireReason = false,
  reasonLabel = "Reason (optional)",
  onConfirm,
  onCancel,
  loading,
}: ConfirmActionDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason || undefined);
    setReason("");
  };

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {isDanger && <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />}
            {isWarning && <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />}
            <div className="flex-1">
              <AlertDialogTitle className={cn(isDanger && "text-destructive")}>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {consequence && (
          <div className={cn(
            "rounded-md px-3 py-2 text-sm",
            isDanger && "bg-destructive/10 text-destructive border border-destructive/20",
            isWarning && "bg-amber-50 text-amber-900 border border-amber-200",
            !isDanger && !isWarning && "bg-muted text-muted-foreground"
          )}>
            {consequence}
          </div>
        )}

        {requireReason && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              rows={2}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || (requireReason && !reason.trim())}
            className={cn(
              isDanger && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {loading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
