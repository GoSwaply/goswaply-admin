export const QueryKeys = {
  overview: () => ["overview"] as const,

  users: (params?: object) => ["users", params] as const,
  user: (id: string) => ["user", id] as const,
  userProfile: (id: string) => ["userProfile", id] as const,
  featureLocks: (id: string) => ["featureLocks", id] as const,

  transactions: (params?: object) => ["transactions", params] as const,
  reconciliation: () => ["reconciliation"] as const,
  treasury: () => ["treasury"] as const,

  cryptoPending: (params?: object) => ["cryptoPending", params] as const,
  giftCardPending: (params?: object) => ["giftCardPending", params] as const,
  kycPending: (params?: object) => ["kycPending", params] as const,

  fraudRules: () => ["fraudRules"] as const,
  cases: (params?: object) => ["cases", params] as const,
  caseDetail: (id: string) => ["caseDetail", id] as const,
  auditLogs: (params?: object) => ["auditLogs", params] as const,

  exchangeMargin: () => ["exchangeMargin"] as const,
  giftCardBrands: () => ["giftCardBrands"] as const,
  giftCardRates: (brandId?: string) => ["giftCardRates", brandId] as const,
  vasMargin: () => ["vasMargin"] as const,
  feeRules: () => ["feeRules"] as const,
  billerPricing: () => ["billerPricing"] as const,
  featureFlags: () => ["featureFlags"] as const,

  maintenance: () => ["maintenance"] as const,
  banners: () => ["banners"] as const,

  gatewayHealth: () => ["gatewayHealth"] as const,
  webhookEvents: (params?: object) => ["webhookEvents", params] as const,

  logSources: () => ["logSources"] as const,
  logTail: (source: string, params?: object) => ["logTail", source, params] as const,
};
