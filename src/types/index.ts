export type { AdminRole, AdminUser, LoginResponse, RefreshResponse } from "./auth";
export type {
  UserListItem,
  WalletInfo,
  FeatureKey,
  FeatureLock,
  UserProfile,
} from "./users";
export type {
  Transaction,
  TransactionStatus,
  TransactionType,
  VasReconciliation,
  TreasurySummary,
} from "./transactions";
export type {
  ExchangeStatus,
  CryptoSellRequest,
  GiftCardSellRequest,
  GiftCardRiskFlag,
} from "./exchange";
export type { KycStatus, KycLevel, KycSubmission } from "./kyc";
export type {
  MarginConfig,
  VasMarginConfig,
  FeeType,
  FeeScope,
  FeeRule,
  CommissionType,
  BillerPricing,
  FeatureFlags,
  GiftCardFormat,
  GiftCardBrand,
  GiftCardBrandInput,
  GiftCardRate,
  GiftCardRateInput,
  RiskAction,
  GiftCardRiskConfig,
} from "./config";
export { GIFT_CARD_FORMAT_LABELS } from "./config";
export type {
  FraudRuleType,
  FraudRuleAction,
  FraudRule,
  CaseStatus,
  CaseNote,
  ComplianceCase,
  AuditLog,
} from "./compliance";
export type {
  MaintenanceMode,
  BannerType,
  AppBanner,
  NotificationSegment,
  BroadcastPayload,
  BroadcastResult,
} from "./system";
export type { GatewayStatus, GatewayHealth, WebhookEventStatus, WebhookEvent } from "./integrations";
export type { LogSource, LogFilters, LogTailResult, LogEntry } from "./logs";
export type { Paginated, PaginationParams } from "./pagination";

export interface DashboardOverview {
  totalUsers: number;
  totalTransactions: number;
  pendingCryptoRequests: number;
  pendingGiftCardRequests: number;
  pendingKycSubmissions: number;
  recentAuditLogs?: import("./compliance").AuditLog[];
  [key: string]: unknown;
}
