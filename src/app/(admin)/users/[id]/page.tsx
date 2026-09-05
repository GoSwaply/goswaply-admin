"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Unlock, KeyRound, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Money } from "@/components/common/Money";
import { DateTime } from "@/components/common/DateTime";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";
import { maskPhone } from "@/lib/formatters";
import { toast } from "sonner";
import type { FeatureKey } from "@/types";
import { FEATURE_KEYS } from "@/lib/constants";

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmReset, setConfirmReset] = useState<"password" | "pin" | null>(null);

  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: QueryKeys.userProfile(id),
    queryFn: () => adminApi.getUserProfile(id),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (reason?: string) => adminApi.resetPassword(id, { reason }),
    onSuccess: () => {
      toast.success("Password reset initiated.");
      setConfirmReset(null);
    },
    onError: () => toast.error("Failed to reset password."),
  });

  const resetPinMutation = useMutation({
    mutationFn: (reason?: string) => adminApi.resetPin(id, { reason }),
    onSuccess: () => {
      toast.success("PIN reset initiated.");
      setConfirmReset(null);
    },
    onError: () => toast.error("Failed to reset PIN."),
  });

  const lockMutation = useMutation({
    mutationFn: ({ feature, isLocked, reason }: { feature: FeatureKey; isLocked: boolean; reason: string }) =>
      adminApi.setFeatureLock(id, feature, { isLocked, reason }),
    onSuccess: () => {
      toast.success("Feature lock updated.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.userProfile(id) });
    },
    onError: () => toast.error("Failed to update feature lock."),
  });

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!profile) return null;

  const { user, wallet, recentTransactions, featureLocks } = profile;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <PageHeader title={user.email} description={`User ID: ${user.id}`} />
      </div>

      <PrivacyNotice message="You are viewing personal user data. Handle in accordance with NDPR/NDPA data protection obligations. Only access data required for the current operational task." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground text-xs mb-0.5">Email</p><p>{user.email}</p></div>
            <div><p className="text-muted-foreground text-xs mb-0.5">Phone</p><p>{maskPhone(user.phoneNumber)}</p></div>
            <div><p className="text-muted-foreground text-xs mb-0.5">Role</p><Badge variant="outline">{user.role}</Badge></div>
            <div><p className="text-muted-foreground text-xs mb-0.5">Account Status</p><StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} /></div>
            <div><p className="text-muted-foreground text-xs mb-0.5">Email Verified</p><StatusBadge status={user.isEmailVerified ? "APPROVED" : "PENDING"} /></div>
            <div><p className="text-muted-foreground text-xs mb-0.5">Phone Verified</p><StatusBadge status={user.isPhoneVerified ? "APPROVED" : "PENDING"} /></div>
            <div><p className="text-muted-foreground text-xs mb-0.5">Joined</p><DateTime value={user.createdAt} /></div>
            {user.onboardingStatus && <div><p className="text-muted-foreground text-xs mb-0.5">Onboarding</p><Badge variant="outline">{user.onboardingStatus}</Badge></div>}
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader><CardTitle>Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {wallet ? (
              <>
                <div><p className="text-muted-foreground text-xs mb-0.5">Balance</p><Money amount={wallet.balance} className="text-lg font-bold" /></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Currency</p><p>{wallet.currency}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Status</p><StatusBadge status={wallet.isActive ? "ACTIVE" : "INACTIVE"} /></div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No wallet data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Locks */}
      <Card>
        <CardHeader><CardTitle>Feature Locks</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURE_KEYS.map((feature) => {
              const lock = featureLocks.find((l) => l.feature === feature);
              const isLocked = lock?.isLocked ?? false;
              return (
                <div key={feature} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{feature.replace(/_/g, " ")}</p>
                    {isLocked && lock?.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">{lock.reason}</p>
                    )}
                  </div>
                  <RoleGate allow={["SUPER_ADMIN"]} mode="disable">
                    <Button
                      size="sm"
                      variant={isLocked ? "destructive" : "outline"}
                      className="gap-1"
                      onClick={() => lockMutation.mutate({
                        feature,
                        isLocked: !isLocked,
                        reason: isLocked ? "Admin unlock" : "Admin lock",
                      })}
                      disabled={lockMutation.isPending}
                    >
                      {isLocked ? <><Lock className="h-3.5 w-3.5" /> Locked</> : <><Unlock className="h-3.5 w-3.5" /> Unlocked</>}
                    </Button>
                  </RoleGate>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {recentTransactions && recentTransactions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <TransactionTable transactions={recentTransactions} compact />
          </CardContent>
        </Card>
      )}

      {/* Privacy data section */}
      <Card>
        <CardHeader><CardTitle>Privacy &amp; Account Data</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-muted-foreground text-xs mb-0.5">User ID</p><p className="font-mono text-xs">{user.id}</p></div>
          <div><p className="text-muted-foreground text-xs mb-0.5">Email Verified</p><p>{user.isEmailVerified ? "Yes" : "No"}</p></div>
          <div><p className="text-muted-foreground text-xs mb-0.5">Phone Verified</p><p>{user.isPhoneVerified ? "Yes" : "No"}</p></div>
          <div><p className="text-muted-foreground text-xs mb-0.5">Account Active</p><p>{user.isActive ? "Yes" : "No"}</p></div>
          <div className="col-span-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">Data deletion or export requests are handled through the compliance workflow in accordance with NDPR/NDPA obligations.</p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <RoleGate allow={["SUPER_ADMIN"]}>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10 gap-2"
              onClick={() => setConfirmReset("password")}
            >
              <KeyRound className="h-4 w-4" /> Reset Password
            </Button>
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10 gap-2"
              onClick={() => setConfirmReset("pin")}
            >
              <KeyRound className="h-4 w-4" /> Reset PIN
            </Button>
          </CardContent>
        </Card>
      </RoleGate>

      {/* Confirm reset password */}
      <ConfirmActionDialog
        open={confirmReset === "password"}
        title="Reset User Password"
        description={`This will initiate a password reset for ${user.email} (${user.id.slice(0, 8)}…).`}
        consequence="The user will receive a password reset link. Their current password will be invalidated."
        confirmLabel="Reset Password"
        variant="danger"
        requireReason
        reasonLabel="Reason for reset"
        onConfirm={(reason) => resetPasswordMutation.mutate(reason)}
        onCancel={() => setConfirmReset(null)}
        loading={resetPasswordMutation.isPending}
      />

      {/* Confirm reset PIN */}
      <ConfirmActionDialog
        open={confirmReset === "pin"}
        title="Reset User PIN"
        description={`This will reset the transaction PIN for ${user.email} (${user.id.slice(0, 8)}…).`}
        consequence="The user will be required to set a new PIN before making transactions."
        confirmLabel="Reset PIN"
        variant="danger"
        requireReason
        reasonLabel="Reason for reset"
        onConfirm={(reason) => resetPinMutation.mutate(reason)}
        onCancel={() => setConfirmReset(null)}
        loading={resetPinMutation.isPending}
      />
    </div>
  );
}
