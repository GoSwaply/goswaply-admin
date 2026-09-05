import { z } from "zod";

export const fraudRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  ruleType: z.enum(["VELOCITY", "AMOUNT_LIMIT", "FREQUENCY", "PATTERN", "BLACKLIST", "DEVICE"]),
  threshold: z.number().positive("Threshold must be greater than zero"),
  action: z.enum(["BLOCK", "FLAG", "ALERT", "REVIEW"]),
  isActive: z.boolean().default(true),
});

export const complianceCaseSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  transactionId: z.string().optional(),
  flagReason: z.string().min(3, "Flag reason is required"),
});

export const caseNoteSchema = z.object({
  note: z.string().min(3, "Note must be at least 3 characters"),
});

export type FraudRuleInput = z.infer<typeof fraudRuleSchema>;
export type ComplianceCaseInput = z.infer<typeof complianceCaseSchema>;
export type CaseNoteInput = z.infer<typeof caseNoteSchema>;
