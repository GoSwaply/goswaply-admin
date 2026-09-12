export type GatewayStatus = "UP" | "DOWN" | "DEGRADED";

export interface GatewayHealth {
  name: string;
  url: string;
  status: GatewayStatus;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
  checkedAt: string;
}

/**
 * PENDING covers both "not tried yet" and "failed, will retry" — the retry
 * worker picks up anything PENDING whose nextRetryAt is due.
 */
export type WebhookEventStatus = "PENDING" | "SUCCESS" | "FAILED_PERMANENT";

export interface WebhookEvent {
  id: string;
  source: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: WebhookEventStatus;
  lastError: string | null;
  retryCount: number;
  processedAt: string | null;
  /** When the retry worker will next pick it up. Null means immediately. */
  nextRetryAt: string | null;
  createdAt: string;
}
