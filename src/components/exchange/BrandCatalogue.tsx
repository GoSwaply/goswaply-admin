"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Pencil, Search, AlertTriangle } from "lucide-react";
import { adminApi } from "@/lib/api/admin-api";
import { QueryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import { RoleGate } from "@/components/rbac/RoleGate";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { GiftCardBrand } from "@/types";

type Filter = "all" | "live" | "off" | "unpriced";

/**
 * The brand catalogue, built for the forty-odd brands a desk is actually asked
 * for rather than the five it started with.
 *
 * At that length the list stops being a sidebar and becomes a working surface:
 * you arrive wanting to switch on the eight cards you just priced, or switch
 * off everything from one region. So it filters, searches, and acts on a
 * selection — one row at a time would be forty confirmations.
 */
export function BrandCatalogue({
  brands,
  selectedBrandId,
  onSelect,
  onEdit,
}: {
  brands: GiftCardBrand[];
  selectedBrandId: string | null;
  onSelect: (id: string) => void;
  onEdit: (brand: GiftCardBrand) => void;
}) {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = usePermissions();
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<null | boolean>(null);

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return brands.filter((brand) => {
      if (needle && !`${brand.name} ${brand.code}`.toLowerCase().includes(needle)) {
        return false;
      }
      const priced = (brand.activeRates ?? 0) > 0;
      if (filter === "live") return brand.active && priced;
      if (filter === "off") return !brand.active;
      if (filter === "unpriced") return !priced;
      return true;
    });
  }, [brands, term, filter]);

  const counts = useMemo(
    () => ({
      all: brands.length,
      live: brands.filter((b) => b.active && (b.activeRates ?? 0) > 0).length,
      off: brands.filter((b) => !b.active).length,
      unpriced: brands.filter((b) => (b.activeRates ?? 0) === 0).length,
    }),
    [brands],
  );

  const bulk = useMutation({
    mutationFn: (active: boolean) =>
      adminApi.setGiftCardBrandsActive({ ids: Array.from(checked), active }),
    onSuccess: (result) => {
      // The server refuses to publish a dead end, and says which brands need
      // pricing first. That is worth reading, so it is a warning not a tick.
      if (result.blocked.length > 0) toast.warning(result.message);
      else toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: QueryKeys.giftCardBrands() });
      setChecked(new Set());
      setConfirming(null);
    },
    onError: (e: Error) => toast.error(e.message || "Could not update those brands."),
  });

  const toggle = (id: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleChecked =
    visible.length > 0 && visible.every((b) => checked.has(b.id));

  const toggleAllVisible = () =>
    setChecked((current) => {
      const next = new Set(current);
      if (allVisibleChecked) visible.forEach((b) => next.delete(b.id));
      else visible.forEach((b) => next.add(b.id));
      return next;
    });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "off", label: "Off" },
    { key: "unpriced", label: "Unpriced" },
  ];

  return (
    <div className="rounded-2xl border overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/40 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Brands ({counts.all})
          </span>
          {counts.unpriced > 0 && (
            <span className="text-[11px] text-amber-700 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {counts.unpriced} unpriced
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            id="brand-search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search brands"
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "text-[11px] rounded-full px-2.5 py-1 border transition-colors",
                filter === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label} {counts[f.key]}
            </button>
          ))}
        </div>

        {isSuperAdmin && visible.length > 0 && (
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={allVisibleChecked}
              onChange={toggleAllVisible}
              className="h-3.5 w-3.5 accent-foreground"
            />
            Select all {visible.length} shown
          </label>
        )}
      </div>

      {/* The action bar appears only with a selection, so it never sits there
          inviting a click that would do nothing. */}
      {checked.size > 0 && (
        <div className="px-4 py-2.5 border-b bg-foreground/5 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">{checked.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setChecked(new Set())}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setConfirming(false)}
            >
              Switch off
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setConfirming(true)}
            >
              Switch on
            </Button>
          </div>
        </div>
      )}

      <ul className="divide-y max-h-[560px] overflow-y-auto">
        {visible.length === 0 && (
          <li className="px-4 py-10 text-center text-xs text-muted-foreground">
            {term.trim() ? `Nothing matches "${term.trim()}".` : "No brands here."}
          </li>
        )}
        {visible.map((brand) => {
          const priced = (brand.activeRates ?? 0) > 0;
          return (
            <li key={brand.id}>
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 hover:bg-muted/20",
                  brand.id === selectedBrandId && "bg-muted/40",
                )}
              >
                {isSuperAdmin && (
                  <input
                    type="checkbox"
                    checked={checked.has(brand.id)}
                    onChange={() => toggle(brand.id)}
                    aria-label={`Select ${brand.name}`}
                    className="h-3.5 w-3.5 accent-foreground shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onSelect(brand.id)}
                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                >
                  {brand.iconUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={brand.iconUrl}
                      alt=""
                      className="h-6 w-6 rounded object-contain shrink-0"
                    />
                  ) : (
                    <span className="h-6 w-6 rounded bg-muted grid place-items-center shrink-0">
                      <Gift className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {brand.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {brand.code}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        · {brand.activeRates ?? 0} rate
                        {(brand.activeRates ?? 0) === 1 ? "" : "s"}
                      </span>
                    </span>
                  </span>
                </button>

                {brand.active && !priced && (
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0 border-amber-300 text-amber-700"
                    title="Customers see this brand but there is nothing to sell under it"
                  >
                    Dead end
                  </Badge>
                )}
                {!brand.active && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Off
                  </Badge>
                )}
                <RoleGate allow={["SUPER_ADMIN"]}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => onEdit(brand)}
                    aria-label={`Edit ${brand.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </RoleGate>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmActionDialog
        open={confirming !== null}
        title={confirming ? "Switch these brands on" : "Switch these brands off"}
        description={`${checked.size} brand${checked.size === 1 ? "" : "s"} selected.`}
        consequence={
          confirming
            ? "Customers will see these in the app straight away. Any without a live rate are refused rather than published as a dead end."
            : "Customers stop seeing these immediately. Trades already submitted against them are unaffected."
        }
        confirmLabel={confirming ? "Switch on" : "Switch off"}
        variant="warning"
        onConfirm={() => bulk.mutate(confirming === true)}
        onCancel={() => setConfirming(null)}
        loading={bulk.isPending}
      />
    </div>
  );
}

/** The turnaround control, used inside the brand form. */
export function ProcessingMinutesHint({ minutes }: { minutes: number }) {
  const human =
    minutes < 60
      ? `${minutes} min`
      : minutes < 1440
        ? `${Math.round((minutes / 60) * 10) / 10} hr`
        : `${Math.round(minutes / 1440)} day`;
  return (
    <p className="text-[11px] text-muted-foreground">
      Shown to sellers before they commit as &ldquo;usually {human}&rdquo;. Promise
      what the queue actually does.
    </p>
  );
}

/** Kept so the brand form can render a consistent on/off control. */
export function ActiveSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 h-9">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="text-sm text-muted-foreground">
        {checked ? "Shown to customers" : "Hidden"}
      </span>
    </div>
  );
}
