import { z } from "zod";

export const kycReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional(),
}).refine(
  (data) => {
    if (data.status === "REJECTED") {
      return data.reason && data.reason.trim().length > 0;
    }
    return true;
  },
  {
    message: "Rejection reason is required",
    path: ["reason"],
  }
);

export const featureLockSchema = z.object({
  isLocked: z.boolean(),
  reason: z.string().min(1, "Reason is required when changing a lock"),
});

export type KycReviewInput = z.infer<typeof kycReviewSchema>;
export type FeatureLockInput = z.infer<typeof featureLockSchema>;
