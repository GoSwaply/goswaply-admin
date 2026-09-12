"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, Loader2, Maximize2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/**
 * The card photo behind a submission.
 *
 * The API streams these rather than linking them, because the photo shows the
 * redeemable code — so the request carries the admin's token and the result is
 * a Blob, not a URL. The object URL is revoked when the component goes away,
 * or a queue reviewed for an hour leaks every card it opened.
 */
export function GiftCardImage({
  requestId,
  className,
  /** Height of the preview. The dialog always shows the photo full size. */
  height = "h-56",
}: {
  requestId: string;
  className?: string;
  height?: string;
}) {
  const [zoomed, setZoomed] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QueryKeys.giftCardImage(requestId),
    queryFn: () => adminApi.giftCardImage(requestId),
    // Each fetch is written to the audit log, so don't re-fetch on every
    // focus change — one view of a card is one entry.
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const objectUrl = URL.createObjectURL(data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [data]);

  const frame = cn(
    "relative rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center",
    height,
    className,
  );

  if (isLoading) {
    return (
      <div className={frame}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !url) {
    return (
      <div className={cn(frame, "flex-col gap-2 px-4 text-center")}>
        <ImageOff className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {isError ? getErrorMessage(error) : "No card image on this submission."}
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className={cn(frame, "group cursor-zoom-in w-full")}
        aria-label="View the card photo full size"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Card submitted by the customer" className="max-h-full max-w-full object-contain" />
        <span className="absolute bottom-2 right-2 rounded-md bg-background/90 border px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-3.5 w-3.5" />
        </span>
      </button>

      {/* Codes are small and often blurry — reading one needs the full size. */}
      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Card photo</DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-auto rounded-lg border bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Card submitted by the customer" className="w-full h-auto" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
