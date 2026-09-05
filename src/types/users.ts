export interface UserListItem {
  id: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface WalletInfo {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FeatureKey =
  | "CRYPTO_SELL"
  | "GIFT_CARD_SELL"
  | "VAS_PAYMENT"
  | "WALLET_FUNDING"
  | "WITHDRAWAL"
  | "FLIGHTS";

export interface FeatureLock {
  feature: FeatureKey;
  isLocked: boolean;
  reason: string | null;
  lockedBy: string | null;
  lockedAt: string | null;
}

export interface UserProfile {
  user: UserListItem & {
    nin?: string;
    bvn?: string;
    dateOfBirth?: string;
    address?: string;
    onboardingStatus?: string;
  };
  wallet: WalletInfo | null;
  recentTransactions: import("./transactions").Transaction[];
  featureLocks: FeatureLock[];
}
