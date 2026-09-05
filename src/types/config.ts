export interface MarginConfig {
  cryptoBuyMarginPercent: number;
  cryptoSellMarginPercent: number;
  giftCardMarginPercent: number;
}

export interface VasMarginConfig {
  defaultVasMarginPercent: number;
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
