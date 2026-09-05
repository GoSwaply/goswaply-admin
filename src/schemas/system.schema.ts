import { z } from "zod";

export const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["INFO", "WARNING", "ERROR", "PROMO"]),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
});

export const broadcastSchema = z.object({
  segment: z.enum(["ALL", "ACTIVE", "INACTIVE", "SPECIFIC"]),
  emails: z
    .array(z.string().email("Invalid email"))
    .optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
}).refine(
  (data) => {
    if (data.segment === "SPECIFIC") {
      return data.emails && data.emails.length > 0;
    }
    return true;
  },
  {
    message: "At least one email is required for SPECIFIC segment",
    path: ["emails"],
  }
);

export const maintenanceSchema = z.object({
  isEnabled: z.boolean(),
  message: z.string().min(1, "Maintenance message is required"),
});

export type BannerInput = z.infer<typeof bannerSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
