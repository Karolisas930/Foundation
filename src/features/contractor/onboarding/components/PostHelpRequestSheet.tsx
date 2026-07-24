/**
 * PostHelpRequestSheet — full-screen form for tradespeople to request
 * collaboration from other self-employed trades (backup, partner,
 * equipment sharing).
 *
 * Requests are stored via `addHelpRequest` and surface inside Job Radar
 * under the "Collaboration / Help Needed" filter.
 */
import { useState } from "react";
import { Handshake, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  addHelpRequest,
  HELP_REQUEST_KINDS,
  type HelpRequestKind,
} from "@/features/shared/help/help-requests";
import { getActiveHandymanProfile } from "@/features/contractor/profile/profile-gate";

const schema = z.object({
  title: z.string().trim().min(3, "Add a short title").max(120),
  kind: z.enum(["backup", "partner", "equipment", "other"]),
  trade: z.string().trim().min(2, "Which trade?").max(60),
  city: z.string().trim().min(2, "City required").max(80),
  startDate: z.string().max(20).optional(),
  durationDays: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v > 0 && v < 366), {
      message: "1–365 days",
    }),
  description: z.string().trim().min(10, "A little more detail helps").max(1000),
  contactName: z.string().trim().min(2, "Your name").max(80),
  contactPhone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const inputCls =
  "mt-1.5 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/35 text-[15px]";
const labelCls = "text-[11px] font-semibold uppercase tracking-widest text-white/60";

export function PostHelpRequestSheet({ open, onOpenChange }: Props) {
  const profile = getActiveHandymanProfile();
  const [kind, setKind] = useState<HelpRequestKind>("backup");
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      title: fd.get("title"),
      kind,
      trade: fd.get("trade"),
      city: fd.get("city"),
      startDate: fd.get("startDate") ?? undefined,
      durationDays: fd.get("durationDays") ?? undefined,
      description: fd.get("description"),
      contactName: fd.get("contactName"),
      contactPhone: fd.get("contactPhone") ?? undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    addHelpRequest(parsed.data);
    setSubmitting(false);
    toast.success("Help request posted", {
      description: "Nearby trades will see it in Job Radar.",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-[#0f172a] p-0 text-slate-50 left-0 top-0 [&>button]:hidden sm:h-[92vh] sm:w-[92vw] sm:max-w-3xl sm:rounded-2xl sm:border sm:border-white/10 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
        <DialogTitle className="sr-only">Post Help Request</DialogTitle>
        <DialogDescription className="sr-only">
          Ask other self-employed trades for backup, a partner, or equipment.
        </DialogDescription>

        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-white/10 px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange/15">
              <Handshake className="h-5 w-5 text-orange" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight text-white sm:text-lg">
                Post Help Request
              </p>
              <p className="truncate text-xs text-white/55">Reach nearby self-employed trades</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto w-full max-w-2xl space-y-7">
              {/* Title */}
              <div>
                <Label htmlFor="hr-title" className={labelCls}>
                  Title
                </Label>
                <Input
                  id="hr-title"
                  name="title"
                  placeholder="e.g. Second pair of hands for bathroom install"
                  maxLength={120}
                  required
                  className={inputCls}
                />
              </div>

              {/* Type of help */}
              <div>
                <Label className={labelCls}>Type of help</Label>
                <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {HELP_REQUEST_KINDS.map((k) => {
                    const active = kind === k.value;
                    return (
                      <button
                        key={k.value}
                        type="button"
                        onClick={() => setKind(k.value)}
                        className={`rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${
                          active
                            ? "border-orange/60 bg-orange/10 text-white shadow-[0_0_0_1px_rgba(255,138,58,0.35)]"
                            : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {k.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trade + City */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="hr-trade" className={labelCls}>
                    Trade
                  </Label>
                  <Input
                    id="hr-trade"
                    name="trade"
                    defaultValue={profile?.trades?.[0] ?? ""}
                    placeholder="Electrician"
                    maxLength={60}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="hr-city" className={labelCls}>
                    City
                  </Label>
                  <Input
                    id="hr-city"
                    name="city"
                    defaultValue={profile?.city ?? ""}
                    placeholder="Mannheim"
                    maxLength={80}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="hr-start" className={labelCls}>
                    Start date
                  </Label>
                  <Input id="hr-start" name="startDate" type="date" className={inputCls} />
                </div>
                <div>
                  <Label htmlFor="hr-days" className={labelCls}>
                    Duration (days)
                  </Label>
                  <Input
                    id="hr-days"
                    name="durationDays"
                    type="number"
                    min={1}
                    max={365}
                    placeholder="e.g. 3"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <Label htmlFor="hr-desc" className={labelCls}>
                  Details
                </Label>
                <Textarea
                  id="hr-desc"
                  name="description"
                  rows={6}
                  maxLength={1000}
                  placeholder="What do you need help with, when, and any requirements?"
                  required
                  className="mt-1.5 min-h-[140px] resize-y bg-white/5 border-white/10 text-white placeholder:text-white/35 text-[15px]"
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="hr-name" className={labelCls}>
                    Contact name
                  </Label>
                  <Input
                    id="hr-name"
                    name="contactName"
                    defaultValue={profile?.firstName ?? ""}
                    maxLength={80}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="hr-phone" className={labelCls}>
                    Phone (optional)
                  </Label>
                  <Input
                    id="hr-phone"
                    name="contactPhone"
                    type="tel"
                    maxLength={40}
                    placeholder="+49 …"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="border-t border-white/10 bg-[#0f172a]/95 px-5 py-4 backdrop-blur sm:px-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 border-white/15 bg-transparent text-white/80 hover:bg-white/5 sm:min-w-32"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="btn-glow h-12 sm:min-w-44">
                Post Request
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PostHelpRequestSheet;
