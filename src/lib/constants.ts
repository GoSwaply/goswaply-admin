export const FEATURE_KEYS = [
  "CRYPTO_SELL",
  "GIFT_CARD_SELL",
  "VAS_PAYMENT",
  "WALLET_FUNDING",
  "WITHDRAWAL",
  "FLIGHTS",
] as const;

export const DEFAULT_PAGE_LIMIT = 20;
export const IDLE_TIMEOUT_MS = 12 * 60 * 1000; // 12 minutes
export const IDLE_WARNING_MS = 11 * 60 * 1000; // warn at 11 minutes

export const CASE_STATUS_ORDER = [
  "OPEN",
  "INVESTIGATING",
  "FUNDS_FROZEN",
  "RESOLVED",
  "CLOSED",
] as const;

export const CASE_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["INVESTIGATING", "CLOSED"],
  INVESTIGATING: ["FUNDS_FROZEN", "RESOLVED", "CLOSED"],
  FUNDS_FROZEN: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export const HIGH_IMPACT_FLAG_KEYWORDS = [
  "crypto",
  "vas",
  "withdrawal",
  "flights",
  "wallet",
  "funding",
  "payment",
];

export const PRIVACY_FOOTER =
  "Admin access is monitored. Use customer data only for authorized operational purposes.";

export const KYC_PRIVACY_NOTICE =
  "You are viewing personal identity data submitted for KYC verification. Handle in accordance with NDPR/NDPA data protection obligations.";

export const AUDIT_LOG_NOTICE =
  "Audit log is a governance record. Access is restricted to authorized compliance personnel only.";

export const LOG_PAGE_NOTICE =
  "Logs may contain operational metadata. Do not export or share outside authorized channels.";

export const COMPLIANCE_CASE_NOTICE =
  "Case data is confidential. Findings must be handled within authorized investigation workflows.";
