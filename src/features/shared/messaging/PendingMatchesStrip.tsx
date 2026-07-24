// @ts-nocheck
/**
 * PendingMatchesStrip — inline UI inside /messages and /notifications for the
 * signed-in user to accept pending matches. Once BOTH parties accept, the
 * backend trigger flips status to 'unlocked', exposing the contractor's
 * contact block on their public profile.
 */
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Handshake, ShieldCheck, ExternalLink } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { acceptMatch } from "@/lib/privacy-gate.functions";

type MatchRow = {
  id: string;
  status: string;
  contractor_id: string;
  client_id: string;
  contractor_accepted_at: string | null;
  client_accepted_at: string | null;
  created_at: string;
};

export function PendingMatchesStrip() {
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<MatchRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const runAccept = useServerFn(acceptMatch);

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
        "id, status, contractor_id, client_id, contractor_accepted_at, client_accepted_at, created_at",
      )
      .or(`contractor_id.eq.${uid},client_id.eq.${uid}`)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) {
      console.error(error);
      setRows([]);
      return;
    }
    setRows(data as MatchRow[]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!userId || !rows || rows.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Handshake className="h-4 w-4 text-orange-300" />
        <h3 className="text-sm font-bold text-slate-100">Deine Matches</h3>
      </div>
      <ul className="space-y-2">
        {rows.map((m) => {
          const iAmContractor = m.contractor_id === userId;
          const iAccepted = iAmContractor
            ? Boolean(m.contractor_accepted_at)
            : Boolean(m.client_accepted_at);
          const other = iAmContractor ? m.client_id : m.contractor_id;
          const unlocked = m.status === "unlocked";
          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/60 px-3 py-2.5 ring-1 ring-white/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {iAmContractor ? "Anfrage von Kunde" : "Handwerker-Profil"}{" "}
                  <span className="text-xs font-mono text-slate-400">{other.slice(0, 8)}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Status:{" "}
                  <span
                    className={
                      unlocked
                        ? "text-emerald-300"
                        : iAccepted
                          ? "text-orange-300"
                          : "text-slate-300"
                    }
                  >
                    {unlocked
                      ? "unlocked — Kontaktdaten sichtbar"
                      : iAccepted
                        ? "warten auf Gegenseite"
                        : "pending — deine Bestätigung nötig"}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {unlocked ? (
                  <a
                    href={`/p/${m.contractor_id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/20"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Kontakt anzeigen
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : iAccepted ? (
                  <span className="text-xs text-slate-500">warten …</span>
                ) : (
                  <Button
                    size="sm"
                    disabled={busyId === m.id}
                    onClick={async () => {
                      setBusyId(m.id);
                      try {
                        const updated = await runAccept({ data: { matchId: m.id } });
                        toast.success(
                          updated.status === "unlocked"
                            ? "Match freigeschaltet."
                            : "Angenommen — warten auf Gegenseite.",
                        );
                        await refresh();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Fehler");
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    {busyId === m.id ? "…" : "Annehmen"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
