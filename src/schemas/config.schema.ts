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

export type MarginInput = z.infer<typeof marginSchema>;
export type VasMarginInput = z.infer<typeof vasMarginSchema>;
export type FeeRuleInput = z.infer<typeof feeRuleSchema>;
export type BillerPricingInput = z.infer<typeof billerPricingSchema>;
