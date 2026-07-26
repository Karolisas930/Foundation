import { useState } from "react";
import { Mail, Pencil, Send, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ProSection } from "./HandymanProSection";

type CompletedJob = {
  id: string;
  client: string;
  email: string;
  finishedAt: string;
  sent: boolean;
};

export function ReviewRequests() {
  const [enabled, setEnabled] = useState(true);
  const [delayDays, setDelayDays] = useState(2);
  const [template, setTemplate] = useState(
    "Hi {client},\n\nThanks again for trusting us with your job. Would you spend 30 seconds leaving a review? It really helps small trade businesses like ours.\n\n— Sent from the team",
  );
  const [jobs, setJobs] = useState<CompletedJob[]>([
    {
      id: "j1",
      client: "Anna Schmidt",
      email: "anna@example.com",
      finishedAt: "2026-06-25",
      sent: false,
    },
    {
      id: "j2",
      client: "Luca Conti",
      email: "luca@example.com",
      finishedAt: "2026-06-20",
      sent: true,
    },
  ]);

  function sendNow(id: string) {
    setJobs((c) => c.map((j) => (j.id === id ? { ...j, sent: true } : j)));
    toast.success("Review request sent (placeholder).");
  }

  return (
    <ProSection
      id="pro-reviews"
      icon={Star}
      title="Automated Review Request"
      subtitle="After every completed job, automatically nudge the client for a review."
    >
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <span className="text-sm text-white">Auto-send after job completion</span>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="review-delay-days" className="text-[11px] uppercase tracking-wider text-slate-400">
            Delay
          </Label>
          <Input
            id="review-delay-days"
            name="review-delay-days"
            type="number"
            min={0}
            value={delayDays}
            onChange={(e) => setDelayDays(Number(e.target.value) || 0)}
            className="intake-input h-8 w-20 text-xs"
          />
          <span className="text-xs text-slate-400">day(s)</span>
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="review-template" className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
          <Pencil className="size-3" /> Message template ({"{client}"} replaced automatically)
        </Label>
        <Textarea
          id="review-template"
          name="review-template"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="intake-input mt-1.5 min-h-[110px] text-xs"
        />
      </div>
      <div className="mt-4 space-y-2">
        {jobs.map((j) => (
          <div
            key={j.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{j.client}</p>
              <p className="truncate text-[11px] text-slate-400">
                {j.email} · completed {j.finishedAt}
              </p>
            </div>
            {j.sent ? (
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Sent
              </span>
            ) : (
              <Button
                type="button"
                onClick={() => sendNow(j.id)}
                className="btn-glow btn-glow-hover h-8 rounded-full px-3 text-xs"
              >
                <Send className="mr-1 size-3" /> Send
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        <Mail className="mr-1 inline size-3" /> Email delivery is a placeholder — connect a provider
        when ready.
      </p>
    </ProSection>
  );
}
