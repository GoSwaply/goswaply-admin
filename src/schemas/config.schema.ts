import { z } from "zod";

export const marginSchema = z.object({
  cryptoBuyMarginPercent: z.number().min(0).max(100),
  cryptoSellMarginPercent: z.number().min(0).max(100),
  giftCardMarginPercent: z.number().min(0).max(100),
});

export const vasMarginSchema = z.object({
  defaultVasMarginPercent: z.number().min(0).max(100),
});

export const feeRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  scope: z.enum(["GLOBAL", "USER", "TRANSACTION_TYPE", "BILLER"]),
  scopeValue: z.string().min(1, "Scope value is required"),
  feeType: z.enum(["PERCENTAGE", "FLAT", "PERCENTAGE_AND_FLAT"]),
  percentageFee: z.number().min(0).nullable().optional(),
  flatFee: z.number().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const billerPricingSchema = z.object({
  billerId: z.string().min(1, "Biller ID is required"),
  billerName: z.string().min(1, "Biller name is required"),
  commissionType: z.enum(["PERCENTAGE", "FLAT"]),
  commissionValue: z.number().min(0, "Commission value must be non-negative"),
});

export const giftCardBrandSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[A-Z0-9_]+$/, "Use capitals, digits and underscores only"),
  name: z.string().min(1, "Name is required"),
  iconUrl: z.string().url("Enter a full image URL").or(z.literal("")).optional(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export const giftCardRateSchema = z
  .object({
    brandId: z.string().min(1, "Pick a brand"),
    countryCode: z.string().length(2, "Two-letter country code"),
    countryName: z.string().min(1, "Country name is required"),
    currency: z.string().length(3, "Three-letter currency code"),
    format: z.enum(["ECODE", "PHYSICAL", "PHYSICAL_WITH_RECEIPT"]),
    minAmount: z.number().min(0, "Cannot be negative"),
    maxAmount: z.number().positive("Must be greater than zero"),
    ratePerUnit: z.number().positive("The rate must be greater than zero"),
    active: z.boolean(),
  })
  .refine((v) => v.minAmount <= v.maxAmount, {
    message: "The minimum cannot exceed the maximum",
    path: ["minAmount"],
  });

export type GiftCardBrandFormInput = z.infer<typeof giftCardBrandSchema>;
export type GiftCardRateFormInput = z.infer<typeof giftCardRateSchema>;

export type MarginInput = z.infer<typeof marginSchema>;
export type VasMarginInput = z.infer<typeof vasMarginSchema>;
export type FeeRuleInput = z.infer<typeof feeRuleSchema>;
export type BillerPricingInput = z.infer<typeof billerPricingSchema>;
