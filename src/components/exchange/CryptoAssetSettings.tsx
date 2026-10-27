"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import type { CryptoAsset, CryptoAssetInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { ErrorState } from "@/components/common/ErrorState";

type AssetForm = {
  coinName: string;
  symbol: string;
  iconUrl: string;
  network: string;
  coinGeckoId: string;
  sellReceivingWalletAddress: string;
  buyEnabled: boolean;
  sellEnabled: boolean;
  isActive: boolean;
  minAmount: string;
  maxAmount: string;
};

const EMPTY_ASSET: AssetForm = {
  coinName: "",
  symbol: "",
  iconUrl: "",
  network: "",
  coinGeckoId: "",
  sellReceivingWalletAddress: "",
  buyEnabled: true,
  sellEnabled: false,
  isActive: true,
  minAmount: "",
  maxAmount: "",
};

function fromAsset(asset: CryptoAsset): AssetForm {
  return {
    coinName: asset.coinName,
    symbol: asset.symbol,
    iconUrl: asset.iconUrl ?? "",
    network: asset.network,
    coinGeckoId: asset.coinGeckoId,
    sellReceivingWalletAddress: asset.sellReceivingWalletAddress ?? "",
    buyEnabled: asset.buyEnabled,
    sellEnabled: asset.sellEnabled,
    isActive: asset.isActive,
    minAmount: String(asset.minAmount),
    maxAmount: asset.maxAmount == null ? "" : String(asset.maxAmount),
  };
}

function toAsset(values: AssetForm): CryptoAssetInput {
  return {
    coinName: values.coinName.trim(),
    symbol: values.symbol.trim().toUpperCase(),
    iconUrl: values.iconUrl.trim() || null,
    network: values.network.trim(),
    coinGeckoId: values.coinGeckoId.trim(),
    sellReceivingWalletAddress: values.sellReceivingWalletAddress.trim(),
    buyEnabled: values.buyEnabled,
    sellEnabled: values.sellEnabled,
    isActive: values.isActive,
    minAmount: Number(values.minAmount),
    maxAmount: values.maxAmount.trim() ? Number(values.maxAmount) : null,
  };
}

export function CryptoAssetSettings() {
  const queryClient = useQueryClient();
  const assetsQuery = useQuery({
    queryKey: QueryKeys.cryptoAssets(),
    queryFn: adminApi.listCryptoAssets,
  });
  const accountQuery = useQuery({
    queryKey: QueryKeys.cryptoPaymentAccount(),
    queryFn: adminApi.getCryptoPaymentAccount,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CryptoAsset | null>(null);
  const [assetForm, setAssetForm] = useState<AssetForm>(EMPTY_ASSET);
  const [account, setAccount] = useState({ accountName: "", accountNumber: "", bankName: "" });

  useEffect(() => {
    if (accountQuery.data) setAccount(accountQuery.data);
  }, [accountQuery.data]);

  const refreshAssets = () => queryClient.invalidateQueries({ queryKey: QueryKeys.cryptoAssets() });
  const saveAsset = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: CryptoAssetInput }) =>
      id ? adminApi.updateCryptoAsset(id, values) : adminApi.createCryptoAsset(values),
    onSuccess: (asset) => {
      toast.success(`${asset.coinName} ${editing ? "updated" : "added"}.`);
      refreshAssets();
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message || "Could not save this asset."),
  });
  const saveAccount = useMutation({
    mutationFn: adminApi.setCryptoPaymentAccount,
    onSuccess: () => {
      toast.success("Crypto buy payment account saved.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.cryptoPaymentAccount() });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the payment account."),
  });

  const openNew = () => {
    setEditing(null);
    setAssetForm(EMPTY_ASSET);
    setDialogOpen(true);
  };
  const openEdit = (asset: CryptoAsset) => {
    setEditing(asset);
    setAssetForm(fromAsset(asset));
    setDialogOpen(true);
  };
  const change = (field: keyof AssetForm, value: string | boolean) =>
    setAssetForm((current) => ({ ...current, [field]: value }));
  const submitAsset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minAmount = Number(assetForm.minAmount);
    const hasMaximum = assetForm.maxAmount.trim().length > 0;
    const maxAmount = hasMaximum ? Number(assetForm.maxAmount) : null;
    if (
      !Number.isFinite(minAmount) ||
      minAmount <= 0 ||
      (maxAmount !== null &&
        (!Number.isFinite(maxAmount) || maxAmount < minAmount))
    ) {
      toast.error("Enter a positive minimum and a valid maximum above it.");
      return;
    }
    if (
      assetForm.sellEnabled &&
      assetForm.sellReceivingWalletAddress.trim().length === 0
    ) {
      toast.error("Add the sell receiving wallet address before enabling sells.");
      return;
    }
    saveAsset.mutate({ id: editing?.id, values: toAsset(assetForm) });
  };
  const submitAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveAccount.mutate({
      accountName: account.accountName.trim(),
      accountNumber: account.accountNumber.trim(),
      bankName: account.bankName.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Supported crypto assets</h2>
            <p className="text-sm text-muted-foreground">Configure customer-facing assets, sell receiving wallets, and trade limits.</p>
          </div>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add asset</Button>
        </div>
        {assetsQuery.isLoading && <TableSkeleton rows={4} cols={6} />}
        {assetsQuery.isError && <ErrorState error={assetsQuery.error} onRetry={assetsQuery.refetch} />}
        {!assetsQuery.isLoading && !assetsQuery.isError && (
          <div className="overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    {["Asset", "Network", "CoinGecko ID", "Sell receiving address", "Limits", "Enabled", ""].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left font-medium text-muted-foreground">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(assetsQuery.data ?? []).map((asset) => (
                    <tr key={asset.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {asset.iconUrl && <img src={asset.iconUrl} alt="" className="h-7 w-7 rounded-full object-cover" />}
                          <span><span className="font-medium">{asset.coinName}</span><span className="ml-1.5 text-muted-foreground">({asset.symbol})</span></span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{asset.network}</td>
                      <td className="px-4 py-3 font-mono text-xs">{asset.coinGeckoId}</td>
                      <td className="max-w-48 truncate px-4 py-3 font-mono text-xs" title={asset.sellReceivingWalletAddress ?? ""}>{asset.sellReceivingWalletAddress}</td>
                      <td className="px-4 py-3 tabular-nums">{asset.minAmount}–{asset.maxAmount ?? "∞"} {asset.symbol}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={asset.isActive ? "text-green-700" : "text-muted-foreground"}>{asset.isActive ? "Active" : "Inactive"}</span>
                        <span className="mx-1.5 text-muted-foreground">·</span>
                        <span className={asset.buyEnabled ? "text-green-700" : "text-muted-foreground"}>Buy {asset.buyEnabled ? "on" : "off"}</span>
                        <span className="mx-1.5 text-muted-foreground">·</span>
                        <span className={asset.sellEnabled ? "text-green-700" : "text-muted-foreground"}>Sell {asset.sellEnabled ? "on" : "off"}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${asset.coinName}`} onClick={() => openEdit(asset)}><Pencil className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                  {(assetsQuery.data ?? []).length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No crypto assets configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Fiat buy-payment account</h2>
        <p className="mb-4 text-sm text-muted-foreground">Bank details customers use to pay for crypto purchases.</p>
        {!accountQuery.isLoading && !accountQuery.isError && !accountQuery.data && (
          <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            Not configured yet. Customers cannot submit crypto buy requests until this account is saved.
          </p>
        )}
        {accountQuery.isError ? <ErrorState error={accountQuery.error} onRetry={accountQuery.refetch} /> : (
          <form onSubmit={submitAccount} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="crypto-account-name">Account name</Label><Input id="crypto-account-name" value={account.accountName} onChange={(event) => setAccount({ ...account, accountName: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="crypto-account-number">Account number</Label><Input id="crypto-account-number" value={account.accountNumber} onChange={(event) => setAccount({ ...account, accountNumber: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="crypto-bank-name">Bank name</Label><Input id="crypto-bank-name" value={account.bankName} onChange={(event) => setAccount({ ...account, bankName: event.target.value })} required /></div>
            <div className="sm:col-span-3"><Button type="submit" disabled={saveAccount.isPending || accountQuery.isLoading}>{saveAccount.isPending ? "Saving…" : "Save payment account"}</Button></div>
          </form>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit crypto asset" : "Add crypto asset"}</DialogTitle></DialogHeader>
          <form onSubmit={submitAsset} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="asset-name">Coin name</Label><Input id="asset-name" value={assetForm.coinName} onChange={(event) => change("coinName", event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="asset-symbol">Symbol</Label><Input id="asset-symbol" value={assetForm.symbol} onChange={(event) => change("symbol", event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="asset-icon">Icon URL</Label><Input id="asset-icon" type="url" value={assetForm.iconUrl} onChange={(event) => change("iconUrl", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="asset-network">Network</Label><Input id="asset-network" value={assetForm.network} onChange={(event) => change("network", event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="asset-coingecko">CoinGecko ID</Label><Input id="asset-coingecko" value={assetForm.coinGeckoId} onChange={(event) => change("coinGeckoId", event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="asset-wallet">Sell receiving wallet address</Label><Input id="asset-wallet" value={assetForm.sellReceivingWalletAddress} onChange={(event) => change("sellReceivingWalletAddress", event.target.value)} required={assetForm.sellEnabled} /></div>
              <div className="space-y-2"><Label htmlFor="asset-min">Minimum amount (coin)</Label><Input id="asset-min" type="number" min="0" step="any" value={assetForm.minAmount} onChange={(event) => change("minAmount", event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="asset-max">Maximum amount (coin, optional)</Label><Input id="asset-max" type="number" min="0" step="any" value={assetForm.maxAmount} onChange={(event) => change("maxAmount", event.target.value)} /></div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={assetForm.buyEnabled} onCheckedChange={(checked) => change("buyEnabled", checked)} />Buy enabled</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={assetForm.sellEnabled} onCheckedChange={(checked) => change("sellEnabled", checked)} />Sell enabled</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={assetForm.isActive} onCheckedChange={(checked) => change("isActive", checked)} />Asset active</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveAsset.isPending}>{saveAsset.isPending ? "Saving…" : "Save asset"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
