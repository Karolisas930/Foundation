import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ExtraSection, useLocalState } from "./shared";

export type EmailConnection = {
  provider: "gmail" | "outlook" | "custom" | null;
  address: string;
  displayName: string;
  signature: string;
  connectedAt: string | null;
};

const EMAIL_KEY = "handyman.emailConnection.v1";

const EMPTY_EMAIL: EmailConnection = {
  provider: null,
  address: "",
  displayName: "",
  signature: "",
  connectedAt: null,
};

export function getConnectedEmail(): EmailConnection {
  if (typeof window === "undefined") return EMPTY_EMAIL;
  try {
    const raw = window.localStorage.getItem(EMAIL_KEY);
    if (!raw) return EMPTY_EMAIL;
    return { ...EMPTY_EMAIL, ...(JSON.parse(raw) as Partial<EmailConnection>) };
  } catch {
    return EMPTY_EMAIL;
  }
}

export function EmailConnectCard() {
  const [conn, setConn] = useLocalState<EmailConnection>(EMAIL_KEY, EMPTY_EMAIL);
  const [draft, setDraft] = useState<EmailConnection>(conn);
  useEffect(() => setDraft(conn), [conn.provider, conn.address]);

  const connected = Boolean(conn.provider && conn.address);

  function save() {
    if (!draft.provider) {
      toast.error("Pick a provider first.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.address.trim())) {
      toast.error("Enter a valid email address.");
      return;
    }
    const next: EmailConnection = {
      ...draft,
      address: draft.address.trim(),
      displayName: draft.displayName.trim(),
      signature: draft.signature,
      connectedAt: new Date().toISOString(),
    };
    setConn(next);
    toast.success(`Email connected — invoices can now be sent from ${next.address}.`);
  }

  function disconnect() {
    setConn(EMPTY_EMAIL);
    setDraft(EMPTY_EMAIL);
    toast.message("Email disconnected. Invoices will fall back to in-app delivery.");
  }

  return (
    <ExtraSection
      id="pro-email-connect"
      icon={Mail}
      title="Connect my email"
      subtitle="Optional. Send invoices, quotes and review requests from your own address — copies stay tracked in-app."
      badge={
        connected ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            <CheckCircle2 className="mr-1 inline size-3" /> Connected
          </span>
        ) : (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
            Not connected
          </span>
        )
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">Provider</Label>
          <Select
            value={draft.provider ?? ""}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, provider: v as EmailConnection["provider"] }))
            }
          >
            <SelectTrigger className="intake-input mt-1.5 h-10">
              <SelectValue placeholder="Choose Gmail, Outlook or custom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gmail">Gmail</SelectItem>
              <SelectItem value="outlook">Outlook / Microsoft 365</SelectItem>
              <SelectItem value="custom">Custom (SMTP / other)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">
            Email address
          </Label>
          <Input
            type="email"
            value={draft.address}
            onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            placeholder="you@yourbusiness.com"
            className="intake-input mt-1.5 h-10"
          />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">Sender name</Label>
          <Input
            value={draft.displayName}
            onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
            placeholder="e.g. Müller Handwerk"
            className="intake-input mt-1.5 h-10"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-[11px] uppercase tracking-wider text-slate-400">
            Default signature
          </Label>
          <Textarea
            value={draft.signature}
            onChange={(e) => setDraft((d) => ({ ...d, signature: e.target.value }))}
            placeholder="— Sent from my business address. Replies go straight to my inbox."
            className="intake-input mt-1.5 min-h-[80px]"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={save}
          className="btn-glow btn-glow-hover h-10 rounded-full px-4 text-xs"
        >
          <Plug className="mr-1.5 size-4" /> {connected ? "Update connection" : "Connect email"}
        </Button>
        {connected && (
          <Button
            type="button"
            variant="ghost"
            onClick={disconnect}
            className="h-10 rounded-full px-4 text-xs text-slate-300 hover:text-white"
          >
            <Unplug className="mr-1.5 size-4" /> Disconnect
          </Button>
        )}
      </div>
      <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-relaxed text-amber-200/90">
        <AlertTriangle className="mr-1 inline size-3" />
        <strong>Legal notice:</strong> When you send from your own address, you remain the sender of
        record for tax, GDPR and contractual purposes. We store a copy of every send for your audit
        trail but never read, modify or use the contents of your inbox. You can disconnect at any
        time.
      </p>
    </ExtraSection>
  );
}
