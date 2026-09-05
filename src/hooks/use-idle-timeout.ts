"use client";

import { useEffect, useRef, useCallback } from "react";
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS } from "@/lib/constants";

interface UseIdleTimeoutOptions {
  onWarn?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  onWarn,
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (!enabled) return;
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);

    warnTimer.current = setTimeout(() => {
      onWarn?.();
    }, IDLE_WARNING_MS);

    timeoutTimer.current = setTimeout(() => {
      onTimeout?.();
    }, IDLE_TIMEOUT_MS);
  }, [enabled, onWarn, onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    };
  }, [enabled, reset]);
}
