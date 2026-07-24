// @ts-nocheck
/**
 * MatchUnlockInbox — Accept → Confirm → Reveal contact flow.
 *
 * Uses the Match-Unlocked Contact Reveal server functions:
 *   - acceptJobMatch  (contractor)
 *   - confirmMatch    (client, sets match_unlocked=true)
 *   - getMatchContact (either party, only when unlocked)
 *
 * Renders every match the signed-in user is a party to. Contractors see
 * "Pending client confirmation" after they accept. Clients see the
 * "Confirm Match" button once the contractor has accepted. Once the
 * match is unlocked, either side can open a modal to reveal the
 * counterparty's name / phone / email / address.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Handshake,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  MapPin,
  User as UserIcon,
  Landmark,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getMatchContact,
  getMatchBankDetails,
  confirmBookingBankTransfer,
  type MatchContact,
  type MatchBankDetails,
} from "@/features/shared/matches/matches.functions";

type Row = {
  id: string;
  job_id: string;
  client_id: string;
  contractor_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  match_unlocked: boolean;
  accepted_at: string | null;
  unlocked_at: string | null;
  created_at: string;
  jobs?: { id: string; title: string | null } | null;
};

export function MatchUnlockInbox() {
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealFor, setRevealFor] = useState<Row | null>(null);
  const [contact, setContact] = useState<MatchContact | null>(null);
  const [contactBusy, setContactBusy] = useState(false);
  const [checkoutFor, setCheckoutFor] = useState<Row | null>(null);
  const [bank, setBank] = useState<MatchBankDetails | null>(null);
  const [bankBusy, setBankBusy] = useState(false);

  const runConfirmBooking = useServerFn(confirmBookingBankTransfer);
  const runGetContact = useServerFn(getMatchContact);
  const runGetBank = useServerFn(getMatchBankDetails);

  const refresh = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setRows([]);
      return;
    }
    const { data, error } = await supabase
      .from("matches")
      .select(
        "id, job_id, client_id, contractor_id, status, match_unlocked, accepted_at, unlocked_at, created_at, jobs:jobs(id,title)",
      )
      .or(`contractor_id.eq.${uid},client_id.eq.${uid}`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error(error);
      setRows([]);
      return;
    }
    setRows(data as unknown as Row[]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openReveal = useCallback(
    async (row: Row) => {
      setRevealFor(row);
      setContact(null);
      setContactBusy(true);
      try {
        const c = await runGetContact({ data: { matchId: row.id } });
        setContact(c);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load contact");
      } finally {
        setContactBusy(false);
      }
    },
    [runGetContact],
  );

  /* Final checkout review — Direct Bank Payment (no online payment). */
  const openCheckout = useCallback(
    async (row: Row) => {
      setCheckoutFor(row);
      setBank(null);
      setBankBusy(true);
      try {
        const b = await runGetBank({ data: { matchId: row.id } });
        setBank(b);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load bank details");
      } finally {
        setBankBusy(false);
      }
    },
    [runGetBank],
  );

  const confirmBooking = useCallback(async () => {
    if (!checkoutFor) return;
    setBusyId(checkoutFor.id);
    try {
      await runConfirmBooking({ data: { matchId: checkoutFor.id } });
      toast.success("Booking confirmed via bank transfer — job is now booked and on the calendar.");
      setCheckoutFor(null);
      setBank(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to confirm booking");
    } finally {
      setBusyId(null);
    }
  }, [checkoutFor, runConfirmBooking, refresh]);

  const visibleRows = useMemo(() => rows ?? [], [rows]);

  if (!userId || rows === null) return null;
  if (visibleRows.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Handshake className="h-4 w-4 text-emerald-300" />
        <h3 className="text-sm font-bold text-slate-100">Match unlock inbox</h3>
      </div>
      <ul className="space-y-2">
        {visibleRows.map((m) => {
          const iAmClient = m.client_id === userId;
          const iAmContractor = m.contractor_id === userId;
          const unlocked = m.match_unlocked;
          const title = m.jobs?.title ?? `Job ${m.job_id.slice(0, 8)}`;

          let statusLabel = "";
          let statusClass = "text-slate-300";
          if (unlocked) {
            statusLabel = "Unlocked — contact revealed";
            statusClass = "text-emerald-300";
          } else if (m.status === "accepted") {
            statusLabel = iAmContractor
              ? "Pending client confirmation"
              : "Contractor accepted — awaiting your confirmation";
            statusClass = "text-orange-300";
          } else if (m.status === "pending") {
            statusLabel = "Pending";
          } else {
            statusLabel = m.status;
          }

          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/60 px-3 py-2.5 ring-1 ring-white/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">{title}</p>
                <p className="text-xs text-slate-400">
                  {iAmContractor ? "You accepted this job" : "Your posted job"} ·{" "}
                  <span className={statusClass}>{statusLabel}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {unlocked ? (
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 bg-emerald-500/15 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
                    onClick={() => openReveal(m)}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Reveal contact
                  </Button>
                ) : iAmClient && m.status === "accepted" ? (
                  <Button
                    size="sm"
                    disabled={busyId === m.id}
                    className="h-8 gap-1.5 bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600"
                    onClick={() => void openCheckout(m)}
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    Review &amp; Book
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-400">
                    <Lock className="h-3 w-3" />
                    Locked
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={revealFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevealFor(null);
            setContact(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Match contact details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Only visible to the two parties on this confirmed match.
            </DialogDescription>
          </DialogHeader>
          {contactBusy ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : contact ? (
            <div className="space-y-3 py-2 text-sm">
              <ContactRow
                icon={<UserIcon className="h-4 w-4" />}
                label="Name"
                value={contact.fullName ?? contact.displayName ?? "—"}
              />
              <ContactRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={contact.phone ?? "—"}
                href={contact.phone ? `tel:${contact.phone}` : undefined}
              />
              <ContactRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={contact.email ?? "—"}
                href={contact.email ? `mailto:${contact.email}` : undefined}
              />
              <ContactRow
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={
                  [
                    contact.addressLine1,
                    contact.addressLine2,
                    [contact.postalCode, contact.city].filter(Boolean).join(" "),
                    contact.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"
                }
              />
            </div>
          ) : (
            <p className="py-6 text-sm text-slate-500">No contact available.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Final checkout review — Direct Bank Payment (manual, off-platform) */}
      <Dialog
        open={checkoutFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCheckoutFor(null);
            setBank(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-500" />
              Final booking review
            </DialogTitle>
            <DialogDescription className="text-xs">
              {checkoutFor?.jobs?.title ?? `Job ${checkoutFor?.job_id.slice(0, 8) ?? ""}`} — pay
              your tradesperson directly by bank transfer. No card details are collected and no
              online payment is processed.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-300">
              <Landmark className="h-4 w-4" />
              Direct Bank Payment
            </p>
            {bankBusy ? (
              <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading bank details…
              </div>
            ) : bank && (bank.iban || bank.bankName || bank.bic) ? (
              <div className="space-y-2 text-sm">
                <BankRow label="Recipient" value={bank.companyName ?? bank.accountHolder ?? "—"} />
                <BankRow label="Account holder" value={bank.accountHolder ?? "—"} />
                <BankRow label="IBAN" value={bank.iban ?? "—"} mono />
                <BankRow label="BIC" value={bank.bic ?? "—"} mono />
                <BankRow label="Bank Name" value={bank.bankName ?? "—"} />
              </div>
            ) : (
              <p className="py-2 text-sm text-slate-400">
                The tradesperson has not added bank details to their company profile yet. You can
                still confirm the booking and arrange the transfer directly.
              </p>
            )}
          </div>

          <Button
            disabled={busyId === checkoutFor?.id}
            className="w-full gap-2 bg-emerald-500 font-bold text-white hover:bg-emerald-600"
            onClick={() => void confirmBooking()}
          >
            {busyId === checkoutFor?.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirm Booking via Bank Transfer
          </Button>
          <p className="text-center text-[11px] text-slate-500">
            Confirming instantly moves this job to <b>booked</b> and creates the calendar entry — no
            payment webhook required.
          </p>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function BankRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/50 px-3 py-2 ring-1 ring-white/5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span
        className={`truncate text-sm font-medium text-slate-100 ${mono ? "font-mono tracking-wide" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-white/10 dark:bg-white/5">
      <span className="mt-0.5 text-slate-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        {href ? (
          <a
            href={href}
            className="block truncate text-sm font-medium text-slate-900 hover:underline dark:text-slate-100"
          >
            {value}
          </a>
        ) : (
          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
        )}
      </div>
    </div>
  );
}
