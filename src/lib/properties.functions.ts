/**
 * Properties / buildings — real Supabase data.
 *
 * A homeowner (or property manager) keeps a list of buildings; each posted
 * project can be attached to one, so contractors know where the work is.
 * Backed by `public.properties` (see db/manual-migrations/).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { untyped } from "@/lib/untyped-db";

export const PROPERTY_TYPES = [
  "house",
  "apartment",
  "multi_family",
  "commercial",
  "land",
  "other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export interface Property {
  id: string;
  label: string;
  propertyType: PropertyType;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  yearBuilt: number | null;
  sizeSqm: number | null;
  units: number;
  notes: string | null;
  createdAt: string;
}

type PropertyRow = {
  id: string;
  label: string;
  property_type: string;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  year_built: number | null;
  size_sqm: number | null;
  units: number | null;
  notes: string | null;
  created_at: string;
};

const SELECT =
  "id, label, property_type, address_line1, address_line2, postal_code, city, country, year_built, size_sqm, units, notes, created_at";

function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    label: row.label,
    propertyType: (PROPERTY_TYPES as readonly string[]).includes(row.property_type)
      ? (row.property_type as PropertyType)
      : "other",
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country ?? "DE",
    yearBuilt: row.year_built,
    sizeSqm: row.size_sqm,
    units: row.units ?? 1,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const propertyInput = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(2).max(120),
  propertyType: z.enum(PROPERTY_TYPES).default("house"),
  addressLine1: z.string().trim().max(200).optional().nullable(),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  country: z.string().trim().max(2).default("DE"),
  yearBuilt: z.number().int().min(1000).max(2200).optional().nullable(),
  sizeSqm: z.number().int().min(0).max(1_000_000).optional().nullable(),
  units: z.number().int().min(1).max(10_000).default(1),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type PropertyInput = z.input<typeof propertyInput>;

/** Every building owned by the signed-in user, newest first. */
export const listMyProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ properties: Property[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await untyped(supabase)
      .from("properties")
      .select(SELECT)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { properties: ((data ?? []) as PropertyRow[]).map(toProperty) };
  });

/** Create or update one building. */
export const saveProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => propertyInput.parse(data))
  .handler(async ({ context, data }): Promise<{ property: Property }> => {
    const { supabase, userId } = context;

    const payload = {
      owner_id: userId,
      label: data.label,
      property_type: data.propertyType ?? "house",
      address_line1: data.addressLine1 ?? null,
      address_line2: data.addressLine2 ?? null,
      postal_code: data.postalCode ?? null,
      city: data.city ?? null,
      country: data.country ?? "DE",
      year_built: data.yearBuilt ?? null,
      size_sqm: data.sizeSqm ?? null,
      units: data.units ?? 1,
      notes: data.notes ?? null,
    };

    const query = data.id
      ? untyped(supabase)
          .from("properties")
          .update(payload)
          .eq("id", data.id)
          .eq("owner_id", userId)
          .select(SELECT)
          .single()
      : untyped(supabase).from("properties").insert(payload).select(SELECT).single();

    const { data: row, error } = await query;
    if (error) throw new Error(error.message);
    return { property: toProperty(row as PropertyRow) };
  });

/** Delete one building. Jobs attached to it keep existing (property_id -> null). */
export const deleteProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await untyped(supabase)
      .from("properties")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
