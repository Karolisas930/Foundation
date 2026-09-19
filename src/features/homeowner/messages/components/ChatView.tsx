/**
 * ChatView — modal chat between homeowner and a specific contractor
 * bidding on the currently selected project.
 */
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import type { EcosystemProposal } from "@/core/demo-session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ChatView({
  bid,
  messages,
  draft,
  sending = false,
  loading = false,
  onDraftChange,
  onClose,
  onSend,
}: {
  bid: EcosystemProposal | null;
  messages: { id: string; senderRole: string; text: string; timestamp: string }[];
  draft: string;
  sending?: boolean;
  loading?: boolean;
  onDraftChange: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <Dialog open={!!bid} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-4 text-orange" />
            Chat with {bid?.company}
          </DialogTitle>
          <DialogDescription>
            Messages are visible to you and the contractor on this project.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading conversation…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet — say hello.</p>
          ) : (
            messages.slice(-10).map((m) => (
              <div key={m.id} className="text-sm">
                <span className="mr-2 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                  {m.senderRole}
                </span>
                {m.text}
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                  {m.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Type a message…"
          rows={3}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="mr-1 size-4" /> Close
          </Button>
          <Button
            onClick={onSend}
            disabled={!draft.trim() || sending}
            className="bg-orange hover:bg-orange/90"
          >
            <Send className="mr-1.5 size-4" /> {sending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
