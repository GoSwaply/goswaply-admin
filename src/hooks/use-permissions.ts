"use client";

import { useCurrentUser } from "./use-current-user";
import * as perms from "@/lib/permissions";

export function usePermissions() {
  const { user } = useCurrentUser();
  return {
    canViewLogs: perms.canViewLogs(user),
    canManageConfig: perms.canManageConfig(user),
    canManageSystem: perms.canManageSystem(user),
    canUpdateUser: perms.canUpdateUser(user),
    canManageFeatureLocks: perms.canManageFeatureLocks(user),
    canSendBroadcast: perms.canSendBroadcast(user),
    canManageComplianceCases: perms.canManageComplianceCases(user),
    canReprocessWebhook: perms.canReprocessWebhook(user),
    canViewAuditLog: perms.canViewAuditLog(user),
    canApproveExchange: perms.canApproveExchange(user),
    canReviewKyc: perms.canReviewKyc(user),
    canManageFraudRules: perms.canManageFraudRules(user),
    canResetCredentials: perms.canResetCredentials(user),
    canFreezeFunds: perms.canFreezeFunds(user),
    isSuperAdmin: perms.isSuperAdmin(user),
  };
}
