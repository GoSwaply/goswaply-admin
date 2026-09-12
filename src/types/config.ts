/**
 * The margin taken on a crypto sell, as a percentage.
 *
 * One figure, because the API keeps one. There is no separate gift card
 * margin: gift card payouts come from the rate matrix, where the desk sets
 * the naira-per-unit price outright, and applying a margin on top of that
 * would take the spread twice.
 */
export interface MarginConfig {
  marginPercent: number;
}

/** Default margin on bill payments, as a percentage. */
export interface VasMarginConfig {
  marginPercent: number;
}

export type FeeType = "PERCENTAGE" | "FLAT" | "PERCENTAGE_AND_FLAT";
export type FeeScope = "GLOBAL" | "USER" | "TRANSACTION_TYPE" | "BILLER";

export interface FeeRule {
  id: string;
  name: string;
  description: string | null;
  scope: FeeScope;
  scopeValue: string;
  feeType: FeeType;
  percentageFee: number | null;
  flatFee: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CommissionType = "PERCENTAGE" | "FLAT";

export interface BillerPricing {
  id: string;
  billerId: string;
  billerName: string;
  commissionType: CommissionType;
  commissionValue: number;
  createdAt: string;
  updatedAt: string;
}

export type FeatureFlags = Record<string, boolean>;

// ==========================================
// GIFT CARD CATALOGUE
// ==========================================

/**
 * How a card is presented — the largest single driver of its price. A physical
 * card with its purchase receipt is verifiable and trades 5-10% above a bare
 * e-code, so each format carries its own rate rather than one blended figure.
 */
export type GiftCardFormat = "ECODE" | "PHYSICAL" | "PHYSICAL_WITH_RECEIPT";

export const GIFT_CARD_FORMAT_LABELS: Record<GiftCardFormat, string> = {
  ECODE: "E-code",
  PHYSICAL: "Physical card",
  PHYSICAL_WITH_RECEIPT: "Physical card with receipt",
};

export interface GiftCardBrand {
  id: string;
  /** Stable machine code. Immutable — clients and history reference it. */
  code: string;
  name: string;
  iconUrl: string | null;
  active: boolean;
  sortOrder: number;
}

/** One price: a brand, in a country, in a format, within a denomination band. */
export interface GiftCardRate {
  id: string;
  brandId: string;
  brand?: GiftCardBrand;
  countryCode: string;
  countryName: string;
  /** The card's own currency — USD, GBP, EUR. Not the payout currency. */
  currency: string;
  format: GiftCardFormat;
  minAmount: string;
  maxAmount: string;
  /** Naira paid per unit of the card's currency. */
  ratePerUnit: string;
  active: boolean;
}

export interface GiftCardBrandInput {
  code: string;
  name: string;
  iconUrl?: string | null;
  active: boolean;
  sortOrder: number;
}

/**
 * Amounts go out as numbers even though they come back as numeric strings —
 * Postgres numeric round-trips as a string, and sending the string back would
 * re-parse fine but hide typos like a stray comma behind a silent NaN.
 */
export interface GiftCardRateInput {
  brandId: string;
  countryCode: string;
  countryName: string;
  currency: string;
  format: GiftCardFormat;
  minAmount: number;
  maxAmount: number;
  ratePerUnit: number;
  active: boolean;
}

// ==========================================
// GIFT CARD FRAUD CONTROLS
// ==========================================

/** What a rule does when it fires. */
export type RiskAction = "BLOCK" | "FLAG" | "OFF";

export interface GiftCardRiskConfig {
  /**
   * When false every rule still runs and records what it would have done,
   * but nothing is blocked — so a threshold can be measured against real
   * traffic before it starts turning customers away.
   */
  enforced: boolean;
  maxPendingSubmissions: number;
  maxSubmissionsPerHour: number;
  maxSubmissionsPerDay: number;
  /** Naira of quoted payout one account may submit in a day. */
  maxPayoutNairaPerDay: number;
  duplicateImageAction: RiskAction;
  velocityAction: RiskAction;
  dailyValueAction: RiskAction;
}
