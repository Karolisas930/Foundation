/**
 * recordMatchInvoice — append a platform-fee ledger row for a contractor
 * match. During the founders' promotional window the promo_code
 * "FOUNDERS_0" fully rebates the fee (final_due_cents = 0).
 *
 * NOTE: The generated Supabase types haven't been regenerated with the
 * `match_invoices` table yet (types.ts is managed by the migration tool).
 * Once regenerated, the `as any` cast below can be removed.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FOUNDERS_PROMO_CODE = "FOUNDERS_0";
export const DEFAULT_PLATFORM_FEE_BPS = 700; // 7%

const inputSchema = z.object({
  matchId: z.string().uuid(),
  netAmountCents: z.number().int().nonnegative().max(100_000_000),
  platformFeeBps: z.number().int().min(0).max(10_000).optional(),
  promoCode: z.string().trim().max(40).optional(),
});

export type MatchInvoiceRow = {
  id: string;
  match_id: string;
  contractor_id: string;
  net_amount_cents: number;
  platform_fee_bps: number;
  promotional_discount_cents: number;
  final_due_cents: number;
  promo_code: string | null;
  created_at: string;
};

export const recordMatchInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bps = data.platformFeeBps ?? DEFAULT_PLATFORM_FEE_BPS;
    const grossFee = Math.round((data.netAmountCents * bps) / 10_000);
    const promo = data.promoCode?.trim() || FOUNDERS_PROMO_CODE;
    const discount = promo === FOUNDERS_PROMO_CODE ? grossFee : 0;
    const finalDue = Math.max(0, grossFee - discount);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from("match_invoices")
      .insert({
        match_id: data.matchId,
        contractor_id: userId,
        net_amount_cents: data.netAmountCents,
        platform_fee_bps: bps,
        promotional_discount_cents: discount,
        final_due_cents: finalDue,
        promo_code: promo,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row as MatchInvoiceRow;
  });

/**
 * Computes the client-side preview of the platform-fee row without
 * hitting the server. The UI mirrors the server logic so contractors see
 * the exact same final_due before we persist.
 */
export function previewFounderFee(netCents: number, bps = DEFAULT_PLATFORM_FEE_BPS) {
  const grossFee = Math.round((netCents * bps) / 10_000);
  return {
    grossFeeCents: grossFee,
    discountCents: grossFee,
    finalDueCents: 0,
    promoCode: FOUNDERS_PROMO_CODE,
    bps,
  };
}
