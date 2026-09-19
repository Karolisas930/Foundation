/**
 * PropertiesPage — list / add / edit / delete the buildings a homeowner owns.
 * Backed by real Supabase data through src/lib/properties.functions.ts.
 */
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, MapPin, Pencil, PlusCircle, Trash2 } from "lucide-react";

import {
  deleteProperty,
  listMyProperties,
  saveProperty,
  PROPERTY_TYPES,
  type Property,
  type PropertyType,
} from "@/lib/properties.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const PROPERTIES_KEY = ["my-properties"] as const;

const TYPE_LABEL: Record<PropertyType, string> = {
  house: "House",
  apartment: "Apartment",
  multi_family: "Multi-family",
  commercial: "Commercial",
  land: "Land",
  other: "Other",
};

type Draft = {
  id?: string;
  label: string;
  propertyType: PropertyType;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  yearBuilt: string;
  sizeSqm: string;
  units: string;
  notes: string;
};

const EMPTY_DRAFT: Draft = {
  label: "",
  propertyType: "house",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "DE",
  yearBuilt: "",
  sizeSqm: "",
  units: "1",
  notes: "",
};

function toDraft(p: Property): Draft {
  return {
    id: p.id,
    label: p.label,
    propertyType: p.propertyType,
    addressLine1: p.addressLine1 ?? "",
    addressLine2: p.addressLine2 ?? "",
    postalCode: p.postalCode ?? "",
    city: p.city ?? "",
    country: p.country || "DE",
    yearBuilt: p.yearBuilt ? String(p.yearBuilt) : "",
    sizeSqm: p.sizeSqm ? String(p.sizeSqm) : "",
    units: String(p.units ?? 1),
    notes: p.notes ?? "",
  };
}

function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function PropertiesPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listMyProperties);
  const saveFn = useServerFn(saveProperty);
  const deleteFn = useServerFn(deleteProperty);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Property | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: PROPERTIES_KEY,
    queryFn: () => listFn(),
  });
  const properties = data?.properties ?? [];

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      saveFn({
        data: {
          id: d.id,
          label: d.label.trim(),
          propertyType: d.propertyType,
          addressLine1: d.addressLine1.trim() || null,
          addressLine2: d.addressLine2.trim() || null,
          postalCode: d.postalCode.trim() || null,
          city: d.city.trim() || null,
          country: (d.country.trim() || "DE").slice(0, 2).toUpperCase(),
          yearBuilt: toNumber(d.yearBuilt),
          sizeSqm: toNumber(d.sizeSqm),
          units: toNumber(d.units) ?? 1,
          notes: d.notes.trim() || null,
        },
      }),
    onSuccess: async (_res, d) => {
      await queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      setDraft(null);
      toast.success(d.id ? "Property updated." : "Property added.");
    },
    onError: (err) => toast.error(errorMessage(err, "Could not save this property.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      setPendingDelete(null);
      toast.success("Property deleted.");
    },
    onError: (err) => toast.error(errorMessage(err, "Could not delete this property.")),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My properties</h1>
          <p className="text-slate-300">
            Keep your buildings here so every project you post shows the right address.
          </p>
        </div>
        <Button
          onClick={() => setDraft({ ...EMPTY_DRAFT })}
          className="h-11 gap-2 rounded-full bg-orange px-5 text-sm font-semibold text-white hover:bg-orange/90"
        >
          <PlusCircle className="size-4" /> Add property
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading your properties…</p>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-slate-200">
          {errorMessage(error, "Your properties could not be loaded.")}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <Building2 className="mx-auto size-8 text-slate-400" />
          <p className="mt-3 text-slate-300">No properties yet.</p>
          <Button
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
            className="mt-4 rounded-full bg-orange px-6 font-semibold text-white hover:bg-orange/90"
          >
            Add your first property
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {properties.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-slate-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-white">{p.label}</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-orange/90">
                    {TYPE_LABEL[p.propertyType]}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${p.label}`}
                    onClick={() => setDraft(toDraft(p))}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${p.label}`}
                    onClick={() => setPendingDelete(p)}
                  >
                    <Trash2 className="size-4 text-red-400" />
                  </Button>
                </div>
              </div>

              {(p.addressLine1 || p.city) && (
                <p className="mt-3 flex items-start gap-2 text-sm text-slate-300">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <span>
                    {[p.addressLine1, p.addressLine2].filter(Boolean).join(", ")}
                    {p.addressLine1 && (p.postalCode || p.city) ? <br /> : null}
                    {[p.postalCode, p.city].filter(Boolean).join(" ")}
                  </span>
                </p>
              )}

              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                {p.yearBuilt ? (
                  <div>
                    <dt className="inline">Built </dt>
                    <dd className="inline text-slate-200">{p.yearBuilt}</dd>
                  </div>
                ) : null}
                {p.sizeSqm ? (
                  <div>
                    <dt className="inline">Size </dt>
                    <dd className="inline text-slate-200">{p.sizeSqm} m²</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="inline">Units </dt>
                  <dd className="inline text-slate-200">{p.units}</dd>
                </div>
              </dl>

              {p.notes ? <p className="mt-3 text-sm text-slate-400">{p.notes}</p> : null}
            </article>
          ))}
        </div>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[color:var(--navy-deep)] text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-extrabold text-white">
              {draft?.id ? "Edit property" : "Add property"}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Only the name is required — everything else helps tradespeople quote accurately.
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.label.trim().length < 2) {
                  toast.error("Give the property a name (at least 2 characters).");
                  return;
                }
                saveMutation.mutate(draft);
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="prop-label">Name</Label>
                <Input
                  id="prop-label"
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder="Family home, Rental flat Berlin…"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prop-type">Type</Label>
                  <select
                    id="prop-type"
                    value={draft.propertyType}
                    onChange={(e) =>
                      setDraft({ ...draft, propertyType: e.target.value as PropertyType })
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prop-units">Units</Label>
                  <Input
                    id="prop-units"
                    inputMode="numeric"
                    value={draft.units}
                    onChange={(e) => setDraft({ ...draft, units: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-addr1">Street and number</Label>
                <Input
                  id="prop-addr1"
                  value={draft.addressLine1}
                  onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-addr2">Address line 2</Label>
                <Input
                  id="prop-addr2"
                  value={draft.addressLine2}
                  onChange={(e) => setDraft({ ...draft, addressLine2: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prop-zip">Postcode</Label>
                  <Input
                    id="prop-zip"
                    value={draft.postalCode}
                    onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="prop-city">City</Label>
                  <Input
                    id="prop-city"
                    value={draft.city}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prop-country">Country</Label>
                  <Input
                    id="prop-country"
                    maxLength={2}
                    value={draft.country}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prop-year">Year built</Label>
                  <Input
                    id="prop-year"
                    inputMode="numeric"
                    value={draft.yearBuilt}
                    onChange={(e) => setDraft({ ...draft, yearBuilt: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prop-size">Size (m²)</Label>
                  <Input
                    id="prop-size"
                    inputMode="numeric"
                    value={draft.sizeSqm}
                    onChange={(e) => setDraft({ ...draft, sizeSqm: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-notes">Notes</Label>
                <Textarea
                  id="prop-notes"
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="Access, parking, key handover…"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-orange text-white hover:bg-orange/90"
                >
                  {saveMutation.isPending ? "Saving…" : "Save property"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Projects linked to this property stay, they just lose the address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PropertiesPage;
