export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
export type KycLevel = "LEVEL_1" | "LEVEL_2" | "LEVEL_3";

export interface KycSubmission {
  id: string;
  userId: string;
  level: KycLevel;
  status: KycStatus;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  nin: string | null;
  bvn: string | null;
  documentType: string | null;
  documentUrl: string | null;
  selfieUrl: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
