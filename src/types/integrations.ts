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

export type WebhookEventStatus =
  | "RECEIVED"
  | "PROCESSED"
  | "FAILED"
  | "REPROCESSING";

export interface WebhookEvent {
  id: string;
  source: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: WebhookEventStatus;
  errorMessage: string | null;
  retryCount: number;
  processedAt: string | null;
  createdAt: string;
}
