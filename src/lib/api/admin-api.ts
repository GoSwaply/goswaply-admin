import { get, getBlob, post, patch, put, del } from "./client";
import type {
  DashboardOverview,
  UserListItem,
  UserProfile,
  FeatureLock,
  FeatureKey,
  Transaction,
  VasReconciliation,
  TreasurySummary,
  CryptoSellRequest,
  GiftCardSellRequest,
  KycSubmission,
  MarginConfig,
  GiftCardBrand,
  GiftCardBrandInput,
  GiftCardRate,
  GiftCardRateInput,
  GiftCardRiskConfig,
  SellPromptConfig,
  VasMarginConfig,
  FeeRule,
  BillerPricing,
  FeatureFlags,
  MaintenanceMode,
  AppBanner,
  BroadcastPayload,
  BroadcastResult,
  FraudRule,
  ComplianceCase,
  AuditLog,
  GatewayHealth,
  WebhookEvent,
  LogSource,
  LogTailResult,
  Paginated,
} from "@/types";

const B = "/api/v1/admin";

function qs(params: Record<string, string | number | boolean | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  // Dashboard
  overview: () => get<DashboardOverview>(`${B}/overview`),

  // Users
  listUsers: (params: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) =>
    get<Paginated<UserListItem>>(`${B}/users${qs(params as Record<string, string | number | boolean | undefined>)}`),
  getUser: (id: string) => get<UserListItem>(`${B}/users/${id}`),
  updateUser: (id: string, body: Partial<UserListItem>) =>
    patch<UserListItem>(`${B}/users/${id}`, body),
  getUserProfile: (id: string) => get<UserProfile>(`${B}/users/${id}/profile`),
  getFeatureLocks: (id: string) => get<FeatureLock[]>(`${B}/users/${id}/feature-locks`),
  setFeatureLock: (
    userId: string,
    feature: FeatureKey,
    body: { isLocked: boolean; reason?: string }
  ) => put<FeatureLock>(`${B}/users/${userId}/feature-locks/${feature}`, body),
  resetPassword: (userId: string, body?: { reason?: string }) =>
    post<{ message: string }>(`${B}/users/${userId}/reset-password`, body),
  resetPin: (userId: string, body?: { reason?: string }) =>
    post<{ message: string }>(`${B}/users/${userId}/reset-pin`, body),

  // Transactions
  listTransactions: (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }) => get<Paginated<Transaction>>(`${B}/transactions${qs(params as Record<string, string | number | boolean | undefined>)}`),
  getVasReconciliation: () => get<VasReconciliation>(`${B}/reconciliation/vas`),
  getTreasury: () => get<TreasurySummary>(`${B}/treasury/summary`),

  // Exchange – Crypto
  // Both pending endpoints return a bare array, not a paginated envelope.
  cryptoPending: () => get<CryptoSellRequest[]>(`${B}/exchange/crypto/pending`),
  approveCrypto: (id: string) => post<CryptoSellRequest>(`${B}/exchange/crypto/${id}/approve`),
  rejectCrypto: (id: string, body: { reason: string }) =>
    post<CryptoSellRequest>(`${B}/exchange/crypto/${id}/reject`, body),

  // Exchange – Gift Card
  giftCardPending: () => get<GiftCardSellRequest[]>(`${B}/exchange/gift-card/pending`),
  /** `nairaValue` overrides the payout quoted at submission. */
  approveGiftCard: (id: string, body?: { nairaValue?: number }) =>
    post<GiftCardSellRequest>(`${B}/exchange/gift-card/${id}/approve`, body),
  rejectGiftCard: (id: string, body: { reason: string }) =>
    post<GiftCardSellRequest>(`${B}/exchange/gift-card/${id}/reject`, body),
  /** The customer's card photo. Streamed by the API, never a public link. */
  giftCardImage: (id: string) => getBlob(`${B}/exchange/gift-card/${id}/image`),

  // KYC
  kycPending: (params?: { page?: number; limit?: number }) =>
    get<Paginated<KycSubmission>>(`${B}/kyc/pending${qs((params ?? {}) as Record<string, string | number | boolean | undefined>)}`),
  reviewKyc: (
    id: string,
    body: { status: "APPROVED" | "REJECTED"; reason?: string }
  ) => post<KycSubmission>(`${B}/kyc/${id}/review`, body),

  // Config – Margins
  getExchangeMargin: () => get<MarginConfig>(`${B}/config/rates`),
  setExchangeMargin: (body: Partial<MarginConfig>) =>
    patch<MarginConfig>(`${B}/config/rates`, body),
  getVasMargin: () => get<VasMarginConfig>(`${B}/config/vas-margin`),
  setVasMargin: (body: Partial<VasMarginConfig>) =>
    patch<VasMarginConfig>(`${B}/config/vas-margin`, body),

  // Gift card catalogue – what the desk buys, and what it pays
  listGiftCardBrands: () => get<GiftCardBrand[]>(`${B}/gift-cards/brands`),
  createGiftCardBrand: (body: GiftCardBrandInput) =>
    post<GiftCardBrand>(`${B}/gift-cards/brands`, body),
  updateGiftCardBrand: (id: string, body: Partial<GiftCardBrandInput>) =>
    patch<GiftCardBrand>(`${B}/gift-cards/brands/${id}`, body),
  /** Switching on a brand with no live rate is refused by name, not silently. */
  setGiftCardBrandsActive: (body: { ids: string[]; active: boolean }) =>
    patch<{ updated: number; blocked: string[]; message: string }>(
      `${B}/gift-cards/brands/bulk`,
      body,
    ),

  listGiftCardRates: (brandId?: string) =>
    get<GiftCardRate[]>(
      `${B}/gift-cards/rates${brandId ? `?brandId=${brandId}` : ""}`
    ),
  createGiftCardRate: (body: GiftCardRateInput) =>
    post<GiftCardRate>(`${B}/gift-cards/rates`, body),
  updateGiftCardRate: (id: string, body: Partial<GiftCardRateInput>) =>
    patch<GiftCardRate>(`${B}/gift-cards/rates/${id}`, body),
  /** Deactivates; never deletes, so quoted history stays resolvable. */
  deactivateGiftCardRate: (id: string) =>
    del<{ ok: boolean }>(`${B}/gift-cards/rates/${id}`),

  // Gift card fraud controls
  getGiftCardRiskConfig: () =>
    get<GiftCardRiskConfig>(`${B}/gift-cards/risk-config`),
  setGiftCardRiskConfig: (body: Partial<GiftCardRiskConfig>) =>
    patch<GiftCardRiskConfig>(`${B}/gift-cards/risk-config`, body),

  // The open-app nudge
  getSellPrompt: () => get<SellPromptConfig>(`${B}/gift-cards/sell-prompt`),
  setSellPrompt: (body: Partial<SellPromptConfig>) =>
    patch<SellPromptConfig>(`${B}/gift-cards/sell-prompt`, body),

  // Config – Fee Rules
  listFeeRules: () => get<FeeRule[]>(`${B}/config/fee-rules`),
  createFeeRule: (body: Omit<FeeRule, "id" | "createdAt" | "updatedAt">) =>
    post<FeeRule>(`${B}/config/fee-rules`, body),
  updateFeeRule: (id: string, body: Partial<FeeRule>) =>
    patch<FeeRule>(`${B}/config/fee-rules/${id}`, body),
  deleteFeeRule: (id: string) => del<void>(`${B}/config/fee-rules/${id}`),

  // Config – Biller Pricing
  listBillerPricing: () => get<BillerPricing[]>(`${B}/biller-pricing`),
  createBillerPricing: (body: Omit<BillerPricing, "id" | "createdAt" | "updatedAt">) =>
    post<BillerPricing>(`${B}/biller-pricing`, body),
  updateBillerPricing: (id: string, body: Partial<BillerPricing>) =>
    patch<BillerPricing>(`${B}/biller-pricing/${id}`, body),

  // Config – Feature Flags
  getFeatureFlags: () => get<FeatureFlags>(`${B}/feature-flags`),
  setFeatureFlag: (key: string, body: { enabled: boolean }) =>
    patch<FeatureFlags>(`${B}/feature-flags/${key}`, body),

  // System – Maintenance
  getMaintenance: () => get<MaintenanceMode>(`${B}/system/maintenance`),
  setMaintenance: (body: Partial<MaintenanceMode>) =>
    patch<MaintenanceMode>(`${B}/system/maintenance`, body),

  // System – Banners
  listBanners: () => get<AppBanner[]>(`${B}/banners`),
  createBanner: (body: Omit<AppBanner, "id" | "createdAt" | "updatedAt">) =>
    post<AppBanner>(`${B}/banners`, body),
  updateBanner: (id: string, body: Partial<AppBanner>) =>
    patch<AppBanner>(`${B}/banners/${id}`, body),
  deleteBanner: (id: string) => del<void>(`${B}/banners/${id}`),

  // System – Notifications
  broadcastNotification: (body: BroadcastPayload) =>
    post<BroadcastResult>(`${B}/notifications/broadcast`, body),

  // Compliance – Fraud Rules
  listFraudRules: () => get<FraudRule[]>(`${B}/fraud-rules`),
  createFraudRule: (body: Omit<FraudRule, "id" | "createdAt" | "updatedAt">) =>
    post<FraudRule>(`${B}/fraud-rules`, body),
  updateFraudRule: (id: string, body: Partial<FraudRule>) =>
    patch<FraudRule>(`${B}/fraud-rules/${id}`, body),
  deleteFraudRule: (id: string) => del<void>(`${B}/fraud-rules/${id}`),

  // Compliance – Cases
  listCases: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    transactionId?: string;
  }) => get<Paginated<ComplianceCase>>(`${B}/cases${qs((params ?? {}) as Record<string, string | number | boolean | undefined>)}`),
  createCase: (body: {
    userId: string;
    transactionId?: string;
    flagReason: string;
  }) => post<ComplianceCase>(`${B}/cases`, body),
  getCase: (id: string) => get<ComplianceCase>(`${B}/cases/${id}`),
  updateCase: (id: string, body: { status?: string; note?: string; assignedTo?: string }) =>
    patch<ComplianceCase>(`${B}/cases/${id}`, body),

  // Compliance – Audit Logs
  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }) => get<Paginated<AuditLog>>(`${B}/audit-logs${qs((params ?? {}) as Record<string, string | number | boolean | undefined>)}`),

  // Integrations – Gateway Health
  gatewayHealth: () => get<GatewayHealth[]>(`${B}/integrations/health`),

  // Integrations – Webhooks
  listWebhookEvents: (params?: {
    page?: number;
    limit?: number;
    source?: string;
    status?: string;
    eventType?: string;
  }) => get<Paginated<WebhookEvent>>(`${B}/webhooks/events${qs((params ?? {}) as Record<string, string | number | boolean | undefined>)}`),
  reprocessWebhook: (id: string) =>
    post<WebhookEvent>(`${B}/webhooks/events/${id}/reprocess`),

  // Logs
  logSources: () => get<LogSource[]>(`${B}/logs/sources`),
  tailLog: (source: string, params?: {
    lines?: number;
    offset?: number;
    search?: string;
    since?: string;
    until?: string;
  }) => get<LogTailResult>(`${B}/logs/${source}${qs((params ?? {}) as Record<string, string | number | boolean | undefined>)}`),
};
