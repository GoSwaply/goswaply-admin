"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Ban, Gift } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { BrandCatalogue } from "@/components/exchange/BrandCatalogue";
import {
  giftCardBrandSchema,
  giftCardRateSchema,
  type GiftCardBrandFormInput,
  type GiftCardRateFormInput,
} from "@/schemas/config.schema";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GIFT_CARD_FORMAT_LABELS } from "@/types";
import type { GiftCardBrand, GiftCardFormat, GiftCardRate } from "@/types";

/**
 * The countries Nigerian desks actually trade, with the currency each card is
 * denominated in. Picking from this list fills the currency in, because a US
 * card priced in GBP is a data-entry slip that would quietly overpay or
 * underpay every seller who chose it.
 */
const COUNTRIES: { code: string; name: string; currency: string }[] = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "DE", name: "Eurozone", currency: "EUR" },
  { code: "CH", name: "Switzerland", currency: "CHF" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "HK", name: "Hong Kong", currency: "HKD" },
  { code: "SE", name: "Sweden", currency: "SEK" },
];

interface CountryGroup {
  code: string;
  name: string;
  currency: string;
  rates: GiftCardRate[];
}

const FORMATS: GiftCardFormat[] = ["ECODE", "PHYSICAL", "PHYSICAL_WITH_RECEIPT"];

const EMPTY_RATE: GiftCardRateFormInput = {
  brandId: "",
  countryCode: "US",
  countryName: "United States",
  currency: "USD",
  format: "ECODE",
  minAmount: 25,
  maxAmount: 500,
  ratePerUnit: 0,
  active: true,
};

export default function GiftCardRatesPage() {
  const queryClient = useQueryClient();

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandDialog, setBrandDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState<GiftCardBrand | null>(null);
  const [rateDialog, setRateDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<GiftCardRate | null>(null);
  const [deactivating, setDeactivating] = useState<GiftCardRate | null>(null);

  const brandsQuery = useQuery({
    queryKey: QueryKeys.giftCardBrands(),
    queryFn: adminApi.listGiftCardBrands,
  });
  const brands = useMemo(() => brandsQuery.data ?? [], [brandsQuery.data]);

  // Land on a brand so the matrix is never an empty right-hand panel.
  useEffect(() => {
    if (!selectedBrandId && brands.length > 0) setSelectedBrandId(brands[0].id);
  }, [brands, selectedBrandId]);

  const ratesQuery = useQuery({
    queryKey: QueryKeys.giftCardRates(selectedBrandId ?? undefined),
    queryFn: () => adminApi.listGiftCardRates(selectedBrandId ?? undefined),
    enabled: !!selectedBrandId,
  });

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? null;

  const invalidateRates = () =>
    queryClient.invalidateQueries({ queryKey: ["giftCardRates"] });

  // ----------------------------------------------------------------- brands

  const brandForm = useForm<GiftCardBrandFormInput>({
    resolver: zodResolver(giftCardBrandSchema),
    defaultValues: {
      code: "",
      name: "",
      iconUrl: "",
      active: true,
      sortOrder: 0,
      processingMinutes: 60,
    },
  });

  const createBrand = useMutation({
    mutationFn: (values: GiftCardBrandFormInput) =>
      adminApi.createGiftCardBrand({ ...values, iconUrl: values.iconUrl || null }),
    onSuccess: (brand) => {
      toast.success(brand.name + " added.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.giftCardBrands() });
      setSelectedBrandId(brand.id);
      setBrandDialog(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not add that brand."),
  });

  const updateBrand = useMutation({
    // `code` is immutable server-side, so it is deliberately not sent.
    mutationFn: ({ id, values }: { id: string; values: GiftCardBrandFormInput }) =>
      adminApi.updateGiftCardBrand(id, {
        name: values.name,
        iconUrl: values.iconUrl || null,
        active: values.active,
        sortOrder: values.sortOrder,
        processingMinutes: values.processingMinutes,
      }),
    onSuccess: () => {
      toast.success("Brand updated.");
      queryClient.invalidateQueries({ queryKey: QueryKeys.giftCardBrands() });
      setEditingBrand(null);
      setBrandDialog(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not update that brand."),
  });

  const openNewBrand = () => {
    setEditingBrand(null);
    brandForm.reset({
      code: "",
      name: "",
      iconUrl: "",
      active: true,
      sortOrder: brands.length + 1,
      processingMinutes: 60,
    });
    setBrandDialog(true);
  };

  const openEditBrand = (brand: GiftCardBrand) => {
    setEditingBrand(brand);
    brandForm.reset({
      code: brand.code,
      name: brand.name,
      iconUrl: brand.iconUrl ?? "",
      active: brand.active,
      sortOrder: brand.sortOrder,
      processingMinutes: brand.processingMinutes ?? 60,
    });
    setBrandDialog(true);
  };

  const submitBrand = (values: GiftCardBrandFormInput) => {
    if (editingBrand) updateBrand.mutate({ id: editingBrand.id, values });
    else createBrand.mutate(values);
  };

  // ------------------------------------------------------------------ rates

  const rateForm = useForm<GiftCardRateFormInput>({
    resolver: zodResolver(giftCardRateSchema),
    defaultValues: EMPTY_RATE,
  });

  const createRate = useMutation({
    mutationFn: adminApi.createGiftCardRate,
    onSuccess: () => {
      toast.success("Rate added.");
      invalidateRates();
      setRateDialog(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not add that rate."),
  });

  const updateRate = useMutation({
    mutationFn: ({ id, values }: { id: string; values: GiftCardRateFormInput }) =>
      adminApi.updateGiftCardRate(id, values),
    onSuccess: () => {
      toast.success("Rate updated.");
      invalidateRates();
      setEditingRate(null);
      setRateDialog(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not update that rate."),
  });

  const deactivateRate = useMutation({
    mutationFn: (id: string) => adminApi.deactivateGiftCardRate(id),
    onSuccess: () => {
      toast.success("Rate withdrawn. Customers will no longer see it.");
      invalidateRates();
      setDeactivating(null);
    },
    onError: (e: Error) => toast.error(e.message || "Could not withdraw that rate."),
  });

  const openNewRate = () => {
    if (!selectedBrandId) return;
    setEditingRate(null);
    rateForm.reset({ ...EMPTY_RATE, brandId: selectedBrandId });
    setRateDialog(true);
  };

  const openEditRate = (rate: GiftCardRate) => {
    setEditingRate(rate);
    rateForm.reset({
      brandId: rate.brandId,
      countryCode: rate.countryCode,
      countryName: rate.countryName,
      currency: rate.currency,
      format: rate.format,
      minAmount: Number(rate.minAmount),
      maxAmount: Number(rate.maxAmount),
      ratePerUnit: Number(rate.ratePerUnit),
      active: rate.active,
    });
    setRateDialog(true);
  };

  const submitRate = (values: GiftCardRateFormInput) => {
    if (editingRate) updateRate.mutate({ id: editingRate.id, values });
    else createRate.mutate(values);
  };

  const onCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) return;
    rateForm.setValue("countryCode", country.code);
    rateForm.setValue("countryName", country.name);
    rateForm.setValue("currency", country.currency);
  };

  // Grouped by country, which is how the customer meets these options and so
  // how the desk needs to read them back when checking for gaps.
  const byCountry = useMemo(() => {
    const groups: CountryGroup[] = [];
    for (const rate of ratesQuery.data ?? []) {
      let group = groups.find((g) => g.code === rate.countryCode);
      if (!group) {
        group = {
          code: rate.countryCode,
          name: rate.countryName,
          currency: rate.currency,
          rates: [],
        };
        groups.push(group);
      }
      group.rates.push(rate);
    }
    groups.forEach((group) =>
      group.rates.sort(
        (a, b) =>
          FORMATS.indexOf(a.format) - FORMATS.indexOf(b.format) ||
          Number(a.minAmount) - Number(b.minAmount),
      ),
    );
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }, [ratesQuery.data]);

  const currency = rateForm.watch("currency");
  const previewPayout =
    (rateForm.watch("ratePerUnit") || 0) * (rateForm.watch("maxAmount") || 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Gift Card Rates"
        description="What the desk buys, and what it pays. Changes reach the app and website immediately."
        actions={
          <RoleGate allow={["SUPER_ADMIN"]}>
            <Button size="sm" variant="outline" onClick={openNewBrand}>
              <Plus className="h-4 w-4" /> Add Brand
            </Button>
          </RoleGate>
        }
      />

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        A rate is naira paid per unit of the card&apos;s own currency: at{" "}
        {formatMoney(1450)} per USD, a $100 card pays out {formatMoney(145000)}. Check the
        figure before you save it.
      </p>

      {brandsQuery.isLoading && <TableSkeleton rows={6} cols={4} />}
      {brandsQuery.isError && (
        <ErrorState
          error={brandsQuery.error}
          onRetry={brandsQuery.refetch}
          title="Failed to load gift card brands"
        />
      )}

      {!brandsQuery.isLoading && !brandsQuery.isError && (
        brands.length === 0 ? (
          <EmptyState
            title="No brands yet"
            description="Add the first brand the desk will buy, then set its rates."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
            <BrandCatalogue
              brands={brands}
              selectedBrandId={selectedBrandId}
              onSelect={setSelectedBrandId}
              onEdit={openEditBrand}
            />

            {/* Rate matrix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium">
                  {selectedBrand ? selectedBrand.name + " rates" : "Rates"}
                </h2>
                <RoleGate allow={["SUPER_ADMIN"]}>
                  <Button size="sm" onClick={openNewRate} disabled={!selectedBrandId}>
                    <Plus className="h-4 w-4" /> Add Rate
                  </Button>
                </RoleGate>
              </div>

              {ratesQuery.isLoading && <TableSkeleton rows={8} cols={5} />}
              {ratesQuery.isError && (
                <ErrorState
                  error={ratesQuery.error}
                  onRetry={ratesQuery.refetch}
                  title="Failed to load rates"
                />
              )}

              {!ratesQuery.isLoading && !ratesQuery.isError && byCountry.length === 0 && (
                <EmptyState
                  title="No rates for this brand"
                  description="Customers cannot sell it until at least one rate exists."
                />
              )}

              {byCountry.map((group) => (
                <div key={group.code} className="rounded-2xl border overflow-hidden">
                  <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center gap-2">
                    <span className="text-sm font-medium">{group.name}</span>
                    <Badge variant="outline" className="text-[10px]">{group.currency}</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Format</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Band</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                            Rate / {group.currency}
                          </th>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {group.rates.map((rate) => (
                          <tr
                            key={rate.id}
                            className={cn("hover:bg-muted/20", !rate.active && "opacity-55")}
                          >
                            <td className="px-4 py-2.5">{GIFT_CARD_FORMAT_LABELS[rate.format]}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                              {Number(rate.minAmount).toLocaleString()} &ndash;{" "}
                              {Number(rate.maxAmount).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                              {formatMoney(Number(rate.ratePerUnit))}
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={rate.active ? "default" : "outline"} className="text-[10px]">
                                {rate.active ? "Live" : "Withdrawn"}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right whitespace-nowrap">
                              <RoleGate allow={["SUPER_ADMIN"]}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditRate(rate)}
                                  aria-label="Edit rate"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                {rate.active && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => setDeactivating(rate)}
                                    aria-label="Withdraw rate"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </RoleGate>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* --------------------------------------------------------- brand form */}
      <Dialog
        open={brandDialog}
        onOpenChange={(open) => {
          if (!open) {
            setBrandDialog(false);
            setEditingBrand(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit " + editingBrand.name : "Add Brand"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={brandForm.handleSubmit(submitBrand)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input
                  value={brandForm.watch("code")}
                  disabled={!!editingBrand}
                  placeholder="AMAZON"
                  onChange={(e) =>
                    brandForm.setValue(
                      "code",
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                      { shouldValidate: true },
                    )
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  {editingBrand
                    ? "Permanent — the apps and past trades reference it."
                    : "Permanent once saved. Capitals, digits and underscores."}
                </p>
                {brandForm.formState.errors.code && (
                  <p className="text-xs text-destructive">{brandForm.formState.errors.code.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input {...brandForm.register("name")} placeholder="Amazon" />
                {brandForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{brandForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Logo URL</Label>
                <Input {...brandForm.register("iconUrl")} placeholder="https://.../amazon.png" />
                {brandForm.formState.errors.iconUrl && (
                  <p className="text-xs text-destructive">{brandForm.formState.errors.iconUrl.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brand-order">Order</Label>
                <Input
                  id="brand-order"
                  type="number"
                  min={0}
                  {...brandForm.register("sortOrder", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brand-minutes">Turnaround (minutes)</Label>
                <Input
                  id="brand-minutes"
                  type="number"
                  min={1}
                  {...brandForm.register("processingMinutes", { valueAsNumber: true })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Shown to sellers before they commit. Promise what the queue
                  actually does.
                </p>
                {brandForm.formState.errors.processingMinutes && (
                  <p className="text-xs text-destructive">
                    {brandForm.formState.errors.processingMinutes.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Buying</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={brandForm.watch("active")}
                    onCheckedChange={(v) => brandForm.setValue("active", v)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {brandForm.watch("active") ? "Shown to customers" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBrandDialog(false);
                  setEditingBrand(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBrand.isPending || updateBrand.isPending}>
                {editingBrand ? "Save" : "Add Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------------- rate form */}
      <Dialog
        open={rateDialog}
        onOpenChange={(open) => {
          if (!open) {
            setRateDialog(false);
            setEditingRate(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRate ? "Edit Rate" : "Add Rate"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={rateForm.handleSubmit(submitRate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Select value={rateForm.watch("countryCode")} onValueChange={onCountryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Format</Label>
                <Select
                  value={rateForm.watch("format")}
                  onValueChange={(v) => rateForm.setValue("format", v as GiftCardFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {GIFT_CARD_FORMAT_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Minimum ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...rateForm.register("minAmount", { valueAsNumber: true })}
                />
                {rateForm.formState.errors.minAmount && (
                  <p className="text-xs text-destructive">
                    {rateForm.formState.errors.minAmount.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Maximum ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...rateForm.register("maxAmount", { valueAsNumber: true })}
                />
                {rateForm.formState.errors.maxAmount && (
                  <p className="text-xs text-destructive">
                    {rateForm.formState.errors.maxAmount.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Naira per {currency}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...rateForm.register("ratePerUnit", { valueAsNumber: true })}
                />
                <p className="text-[11px] text-muted-foreground">
                  A {currency} {rateForm.watch("maxAmount") || 0} card would pay out{" "}
                  <span className="font-medium text-foreground">{formatMoney(previewPayout)}</span>.
                </p>
                {rateForm.formState.errors.ratePerUnit && (
                  <p className="text-xs text-destructive">
                    {rateForm.formState.errors.ratePerUnit.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Offered</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={rateForm.watch("active")}
                    onCheckedChange={(v) => rateForm.setValue("active", v)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {rateForm.watch("active") ? "Customers can pick this option" : "Withdrawn"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRateDialog(false);
                  setEditingRate(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRate.isPending || updateRate.isPending}>
                {editingRate ? "Save Rate" : "Add Rate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={!!deactivating}
        title="Withdraw this rate"
        description={
          deactivating
            ? GIFT_CARD_FORMAT_LABELS[deactivating.format] +
              " · " +
              deactivating.countryName +
              " · " +
              formatMoney(Number(deactivating.ratePerUnit)) +
              " per " +
              deactivating.currency
            : ""
        }
        consequence="Customers stop seeing this option immediately. Trades already quoted at it are unaffected, and you can turn it back on by editing it."
        confirmLabel="Withdraw Rate"
        variant="warning"
        onConfirm={() => deactivating && deactivateRate.mutate(deactivating.id)}
        onCancel={() => setDeactivating(null)}
        loading={deactivateRate.isPending}
      />
    </div>
  );
}
