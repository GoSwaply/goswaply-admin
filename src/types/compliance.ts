export type FraudRuleType =
  | "VELOCITY"
  | "AMOUNT_LIMIT"
  | "FREQUENCY"
  | "PATTERN"
  | "BLACKLIST"
  | "DEVICE";

export type FraudRuleAction = "BLOCK" | "FLAG" | "ALERT" | "REVIEW";

export interface FraudRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: FraudRuleType;
  threshold: number;
  action: FraudRuleAction;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export type CaseStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "FUNDS_FROZEN"
  | "RESOLVED"
  | "CLOSED";

export interface CaseNote {
  id: string;
  caseId: string;
  note: string;
  addedBy: string;
  createdAt: string;
}

export interface ComplianceCase {
  id: string;
  userId: string;
  transactionId: string | null;
  flagReason: string;
  status: CaseStatus;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes: CaseNote[];
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  payloadBefore: Record<string, unknown> | null;
  payloadAfter: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}
