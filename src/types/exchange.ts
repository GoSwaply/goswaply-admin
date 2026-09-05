export type ExchangeStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CryptoSellRequest {
  id: string;
  userId: string;
  cryptoAsset: string;
  cryptoAmount: number;
  nairaEquivalent: number;
  walletAddress: string;
  txHash: string | null;
  status: ExchangeStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCardSellRequest {
  id: string;
  userId: string;
  cardBrand: string;
  cardType: string;
  cardValue: number;
  nairaEquivalent: number;
  cardCode: string | null;
  cardPin: string | null;
  status: ExchangeStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
