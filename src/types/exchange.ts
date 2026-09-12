import type { GiftCardFormat } from "./config";

export type ExchangeStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * These mirror the API's `crypto_sell_requests` / `gift_card_sell_requests`
 * rows exactly, because the pending endpoints return the entity untouched.
 * Decimal columns arrive as strings from Postgres, so every money field is
 * widened to `number | string` and read through `Number(...)` at the edge.
 */
export interface CryptoSellRequest {
  id: string;
  userId: string;
  /** Amount of crypto being sold. */
  amount: number | string;
  /** Asset ticker, e.g. BTC. */
  currency: string;
  rateAtSubmission: number | string | null;
  nairaValue: number | string | null;
  marginPercent: number | string;
  status: ExchangeStatus;
  reference: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCardSellRequest {
  id: string;
  userId: string;
  /** Card face value, in the card's own currency. */
  amount: number | string;
  cardType: string;
  /** Payout. Set from the quoted rate at submission, or by the desk on review. */
  nairaValue: number | string | null;
  imageKey: string;
  status: ExchangeStatus;
  reference: string;
  createdAt: string;
  updatedAt: string;

  /**
   * The catalogue option the customer picked, copied onto the row at
   * submission. Null on submissions that predate the catalogue and on older
   * app builds, which the desk still prices by hand.
   */
  rateId: string | null;
  countryCode: string | null;
  countryName: string | null;
  currency: string | null;
  format: GiftCardFormat | null;
  ratePerUnit: number | string | null;
}
