export interface MaintenanceMode {
  isEnabled: boolean;
  message: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type BannerType = "INFO" | "WARNING" | "ERROR" | "PROMO";

export interface AppBanner {
  id: string;
  title: string;
  message: string;
  type: BannerType;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationSegment = "ALL" | "ACTIVE" | "INACTIVE" | "SPECIFIC";

export interface BroadcastPayload {
  segment: NotificationSegment;
  emails?: string[];
  subject: string;
  message: string;
}

export interface BroadcastResult {
  queued: number;
  message: string;
}
