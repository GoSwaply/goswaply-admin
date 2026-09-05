export type TransactionStatus = "SUCCESS" | "PENDING" | "FAILED" | "REVERSED";
export type TransactionType =
  | "WALLET_FUNDING"
  | "WITHDRAWAL"
  | "VAS_PAYMENT"
  | "CRYPTO_SELL"
  | "GIFT_CARD_SELL"
  | "TRANSFER"
  | "FEE"
  | "REVERSAL";

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reference: string;
  balanceBefore: number;
  balanceAfter: number;
  billerId: string | null;
  vasMarginPercent: number | null;
  providerCostEstimated: number | null;
  profitEstimated: number | null;
  processorResponse: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface VasReconciliation {
  totalUserDebits: number;
  totalEstimatedProviderCost: number;
  totalEstimatedProfit: number;
  transactionCount: number;
}

export interface TreasurySummary {
  totalUsers: number;
  activeWallets: number;
  totalPlatformBalance: number;
  minWalletBalance: number;
  maxWalletBalance: number;
  avgWalletBalance: number;
}
