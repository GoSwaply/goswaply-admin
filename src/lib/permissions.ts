import type { AdminUser, AdminRole } from "@/types";

export function hasRole(user: AdminUser | null, roles: AdminRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export const isSuperAdmin = (user: AdminUser | null) =>
  hasRole(user, ["SUPER_ADMIN"]);

export const canViewLogs = (user: AdminUser | null) => isSuperAdmin(user);
export const canManageConfig = (user: AdminUser | null) => isSuperAdmin(user);
export const canManageSystem = (user: AdminUser | null) => isSuperAdmin(user);
export const canUpdateUser = (user: AdminUser | null) => isSuperAdmin(user);
export const canManageFeatureLocks = (user: AdminUser | null) => isSuperAdmin(user);
export const canSendBroadcast = (user: AdminUser | null) => isSuperAdmin(user);
export const canManageComplianceCases = (user: AdminUser | null) => isSuperAdmin(user);
export const canReprocessWebhook = (user: AdminUser | null) => isSuperAdmin(user);
export const canViewAuditLog = (user: AdminUser | null) => hasRole(user, ["SUPER_ADMIN", "SUPPORT"]);
export const canApproveExchange = (user: AdminUser | null) => hasRole(user, ["SUPER_ADMIN", "SUPPORT"]);
export const canReviewKyc = (user: AdminUser | null) => hasRole(user, ["SUPER_ADMIN", "SUPPORT"]);
export const canManageFraudRules = (user: AdminUser | null) => isSuperAdmin(user);
export const canResetCredentials = (user: AdminUser | null) => isSuperAdmin(user);
export const canFreezeFunds = (user: AdminUser | null) => isSuperAdmin(user);
