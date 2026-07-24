/**
 * Mutations against the Chameleon Ecosystem Ledger.
 * Each helper updates the ledger and broadcasts the change event so all
 * subscribed surfaces (HomeownerPortal, HandymanWorkspace, dashboards)
 * re-render in sync.
 */
import {
  getEcosystemLedger,
  updateEcosystemLedger,
  type EcosystemMessage,
  type EcosystemOrder,
} from "@/core/demo-session";

function fmtTimestamp(d = new Date()): string {
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `today · ${hh}:${mm}`;
}

export function sendQuickQuestion(projectId: string, text: string): boolean {
  const clean = text.trim();
  if (!clean) return false;
  const ledger = getEcosystemLedger();
  const msg: EcosystemMessage = {
    id: `MSG-${Date.now()}`,
    projectId,
    senderRole: "handyman",
    text: clean,
    timestamp: fmtTimestamp(),
  };
  ledger.messages = [msg, ...(ledger.messages ?? [])];
  // flip status so homeowner sees a clarifying state on this project
  ledger.projects = ledger.projects.map((p) =>
    p.id === projectId && p.status === "open" ? { ...p, status: "clarifying" } : p,
  );
  updateEcosystemLedger(ledger);
  return true;
}

export function orderEcosystemSupply(
  projectId: string,
  lane: "disposal" | "logistics",
  item: string,
): string | null {
  if (!projectId || !item) return null;
  const ledger = getEcosystemLedger();
  const order: EcosystemOrder = {
    id: `ORD-${Date.now()}`,
    projectId,
    lane,
    item,
    placedAt: new Date().toISOString(),
  };
  ledger.orders = [order, ...(ledger.orders ?? [])];
  updateEcosystemLedger(ledger);
  return order.id;
}
