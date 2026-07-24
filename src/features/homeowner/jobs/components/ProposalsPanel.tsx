/**
 * ProposalsPanel — the "Incoming speed quotations & proposals" panel.
 * Renders every bid on the selected project with breakdown, match badge,
 * chat/accept CTAs, and a link to the contractor's public profile.
 */
import { Link } from "@tanstack/react-router";
import { Building2, Handshake, MapPin, MessageSquare, Star } from "lucide-react";
import type { EcosystemProject, EcosystemProposal } from "@/core/demo-session";
import { Button } from "@/components/ui/button";
import { getMatchScore } from "../../dashboard/components/parts/helpers";
import { Panel } from "../../dashboard/components/parts/Panel";
import { Breakdown } from "../../dashboard/components/parts/Breakdown";
import { ContractorAvatar } from "../../dashboard/components/parts/ContractorAvatar";
import { MatchScoreBadge } from "../../dashboard/components/parts/MatchScoreBadge";

export function ProposalsPanel({
  project,
  proposals,
  onChat,
  onAccept,
  onOpenProfile,
}: {
  project: EcosystemProject;
  proposals: EcosystemProposal[];
  onChat: (bid: EcosystemProposal) => void;
  onAccept: (bid: EcosystemProposal) => void;
  onOpenProfile: (bid: EcosystemProposal) => void;
}) {
  const isAccepted = project.status === "awarded";

  return (
    <Panel>
      <div id="bids-panel" className="scroll-mt-24" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange/90">
            Incoming
          </p>
          <h3 className="mt-2 font-display text-2xl font-extrabold text-white">
            Speed quotations &amp; proposals
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {isAccepted
              ? "This project is awarded — other bids are archived."
              : "Bids streaming in from matched B2B contractors."}
          </p>
        </div>
        {!isAccepted && proposals.length > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-glow">
            <span className="live-dot" /> Live
          </span>
        )}
      </div>

      {!isAccepted && proposals.length > 0 && (
        <div className="stream-bar mt-4 h-px w-full">
          <span className="stream-bar-line" />
        </div>
      )}

      <div className="mt-5 space-y-4">
        {proposals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            <Handshake className="mx-auto mb-2 size-5 text-orange/80" />
            Bids will appear here as soon as matched tradespeople respond.
          </div>
        ) : (
          proposals.map((bid, idx) => {
            const total = bid.labor + bid.materials + bid.travel;
            const score = getMatchScore(bid.id);
            return (
              <article
                key={bid.id}
                style={{ animationDelay: `${Math.min(idx, 6) * 70}ms` }}
                className="stream-in group/bid relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange/50 hover:bg-white/[0.07] hover:shadow-[0_20px_50px_-25px_color-mix(in_oklab,var(--orange)_60%,transparent)]"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-orange/10 opacity-0 blur-3xl transition group-hover/bid:opacity-100"
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {bid.profileId ? (
                      <Link
                        to="/p/$profileId"
                        params={{ profileId: bid.profileId }}
                        aria-label={`Öffne öffentliches Profil von ${bid.company}`}
                        className="group/link flex min-w-0 flex-1 items-start gap-3 rounded-xl -m-1 p-1 outline-none transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-orange/60"
                      >
                        <ContractorAvatar name={bid.company} />
                        <div className="min-w-0">
                          <div className="font-display text-lg font-bold text-white underline-offset-4 transition group-hover/link:text-orange group-hover/link:underline">
                            {bid.company}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <Star className="size-3 fill-amber-400 stroke-amber-400" />
                              {bid.rating.toFixed(1)}
                            </span>
                            {bid.city && (
                              <>
                                <span className="text-slate-600">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="size-3" /> {bid.city}
                                </span>
                              </>
                            )}
                            {bid.postedAt && (
                              <>
                                <span className="text-slate-600">·</span>
                                <span>{bid.postedAt}</span>
                              </>
                            )}
                            <span className="text-slate-600">·</span>
                            <span className="text-orange/80">Profil ansehen →</span>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <ContractorAvatar name={bid.company} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onOpenProfile(bid)}
                            className="font-display text-lg font-bold text-white underline-offset-4 transition hover:text-orange hover:underline"
                          >
                            {bid.company}
                          </button>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <Star className="size-3 fill-amber-400 stroke-amber-400" />
                              {bid.rating.toFixed(1)}
                            </span>
                            {bid.city && (
                              <>
                                <span className="text-slate-600">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="size-3" /> {bid.city}
                                </span>
                              </>
                            )}
                            {bid.postedAt && (
                              <>
                                <span className="text-slate-600">·</span>
                                <span>{bid.postedAt}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <MatchScoreBadge score={score} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Breakdown label="Labor" value={bid.labor} />
                  <Breakdown label="Materials" value={bid.materials} />
                  <Breakdown label="Travel" value={bid.travel} />
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Total proposal
                    </div>
                    <div className="font-display text-2xl font-extrabold text-white">
                      €{total.toLocaleString("de-DE")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onChat(bid)}
                      className="h-10 gap-1.5 rounded-full border-white/15 bg-transparent text-slate-100 hover:bg-white/10 hover:text-white"
                    >
                      <MessageSquare className="size-4" /> Chat
                    </Button>
                    <Button
                      onClick={() => onAccept(bid)}
                      disabled={isAccepted}
                      className="h-10 gap-1.5 rounded-full bg-orange text-white hover:bg-orange/90 disabled:opacity-50"
                    >
                      <Handshake className="size-4" />
                      {isAccepted ? "Accepted" : "Accept bid"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
      {/* silence unused import warning for Building2 which is used only in the profile dialog. */}
      <span className="hidden">
        <Building2 />
      </span>
    </Panel>
  );
}
