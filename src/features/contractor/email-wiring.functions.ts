/**
 * Phase 8 — Business Email Connection (local mock handlers).
 *
 * Pure TypeScript, no network. Provides type-safe stubs the UI can call
 * before the real outbound-email provider is wired in. Every function is
 * deterministic and safe to call during SSR / preview builds.
 */

export type EmailProvider = "gmail" | "outlook" | "custom";

export type EmailConnectionStatus = {
  connected: boolean;
  provider: EmailProvider | null;
  address: string | null;
  lastVerifiedAt: string | null;
  reason?: string;
};

export type InboundEmailPulse = {
  id: string;
  receivedAt: string;
  fromAddress: string;
  subject: string;
  kind: "reply" | "bounce" | "auto-reply" | "unknown";
  threadHint: string | null;
};

export type VerifyConnectionInput = {
  provider: EmailProvider;
  address: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Local mock: pretend to ping the provider and confirm the mailbox exists. */
export function verifyEmailConnection(input: VerifyConnectionInput): EmailConnectionStatus {
  const address = input.address.trim();
  if (!EMAIL_RE.test(address)) {
    return {
      connected: false,
      provider: input.provider,
      address,
      lastVerifiedAt: null,
      reason: "invalid_address",
    };
  }
  return {
    connected: true,
    provider: input.provider,
    address,
    lastVerifiedAt: new Date().toISOString(),
  };
}

/** Local mock: derive a "connected" summary from a stored record. */
export function readEmailConnectionStatus(
  stored: { provider: EmailProvider; address: string } | null,
): EmailConnectionStatus {
  if (!stored) {
    return {
      connected: false,
      provider: null,
      address: null,
      lastVerifiedAt: null,
    };
  }
  return verifyEmailConnection(stored);
}

/** Local mock: synth a deterministic set of "inbound pulses" for the UI. */
export function simulateInboundPulses(address: string, count = 3): InboundEmailPulse[] {
  if (!EMAIL_RE.test(address)) return [];
  const kinds: InboundEmailPulse["kind"][] = ["reply", "auto-reply", "bounce", "unknown"];
  const now = Date.now();
  return Array.from({ length: Math.max(0, Math.min(count, 20)) }, (_, i) => ({
    id: `pulse-${now}-${i}`,
    receivedAt: new Date(now - i * 60_000).toISOString(),
    fromAddress: `client${i + 1}@example.com`,
    subject:
      i === 0
        ? "Re: Your quote"
        : i === 1
          ? "Out of office"
          : i === 2
            ? "Undeliverable"
            : "Follow-up",
    kind: kinds[i % kinds.length],
    threadHint: i === 0 ? "quote-42" : null,
  }));
}

/** Local mock: pretend to disconnect and return the cleared status. */
export function disconnectEmail(): EmailConnectionStatus {
  return {
    connected: false,
    provider: null,
    address: null,
    lastVerifiedAt: null,
    reason: "disconnected",
  };
}
