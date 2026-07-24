import { useState } from "react";
import { Mail, TestTube2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldLabel, ModalShell, inputCls } from "./ModalShell";
import { KEYS, readJSON, writeJSON, type EmailState } from "./types";

export function ConnectEmailModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const current = readJSON<EmailState>(KEYS.email);
  const [provider, setProvider] = useState<"gmail" | "outlook">(current?.provider ?? "gmail");
  const [address, setAddress] = useState(current?.address ?? "");
  const [testing, setTesting] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      toast.error("Enter a valid email address");
      return;
    }
    writeJSON(KEYS.email, { provider, address });
    toast.success("Email connected", {
      description: `${provider === "gmail" ? "Gmail" : "Outlook"} · ${address}`,
    });
    onOpenChange(false);
  }

  function runTest() {
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      toast.error("Enter a valid email address to test");
      return;
    }
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success("Test message queued", {
        description: `Sent probe to ${address}`,
      });
    }, 900);
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={Mail}
      title="Connect My Email"
      subtitle="Link Gmail or Outlook for client replies"
    >
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Provider</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {(["gmail", "outlook"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition " +
                  (provider === p
                    ? "border-orange-glow/60 bg-white/[0.06] text-white"
                    : "border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]")
                }
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                {p === "gmail" ? "Gmail" : "Outlook"}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <FieldLabel>Email address</FieldLabel>
          <Input
            required
            type="email"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </label>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55">
          We use OAuth to read replies to your quotes. You can disconnect any time from Settings.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={runTest}
            disabled={testing}
            className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
          >
            <TestTube2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
            {testing ? "Testing…" : "Send test"}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Connect
            </Button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
