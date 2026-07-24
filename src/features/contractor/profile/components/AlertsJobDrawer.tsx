import { useEffect, useRef, useState } from "react";
import {
  ALargeSmall,
  Check,
  Clock,
  MapPin,
  Mic,
  Pencil,
  Send,
  Sparkles,
  Wallet,
} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

import type { Lead } from "./alerts-types";

export function AlertsJobDrawer({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [snap, setSnap] = useState<number | string | null>(0.55);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const TEXT_SIZE_PRESETS = { normal: 13.5, large: 16.5, xl: 20 } as const;
  const SIZE_ORDER: Array<keyof typeof TEXT_SIZE_PRESETS> = ["normal", "large", "xl"];
  const SIZE_LABEL: Record<keyof typeof TEXT_SIZE_PRESETS, string> = {
    normal: "A",
    large: "A+",
    xl: "A++",
  };
  const [sizeKey, setSizeKey] = useState<keyof typeof TEXT_SIZE_PRESETS>("normal");
  const [fontPx, setFontPx] = useState<number>(TEXT_SIZE_PRESETS.normal);
  const cycleSize = () => {
    const next = SIZE_ORDER[(SIZE_ORDER.indexOf(sizeKey) + 1) % SIZE_ORDER.length];
    setSizeKey(next);
    setFontPx(TEXT_SIZE_PRESETS[next]);
  };
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; size: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const onDetailsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchStartRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        size: fontPx,
      };
    }
  };
  const onDetailsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2 && pinchStartRef.current) {
      e.preventDefault();
      const [a, b] = Array.from(pointersRef.current.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = d / pinchStartRef.current.dist;
      const next = Math.max(12, Math.min(32, pinchStartRef.current.size * ratio));
      setFontPx(next);
    }
  };
  const onDetailsPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
  };
  const onDetailsClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      cycleSize();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  const startRecognition = () => {
    if (typeof window === "undefined") return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "de-DE";
    finalTranscriptRef.current = draft ? draft.trim() + " " : "";
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscriptRef.current += res[0].transcript + " ";
        } else {
          interim += res[0].transcript;
        }
      }
      setDraft((finalTranscriptRef.current + interim).replace(/\s+/g, " "));
    };
    rec.onerror = (e: any) => {
      console.warn("SpeechRecognition error", e);
      setRecording(false);
    };
    rec.onend = () => {
      if (recognitionRef.current === rec && recording) {
        try {
          rec.start();
        } catch {
          /* noop */
        }
      }
    };
    try {
      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.warn("Failed to start recognition", err);
      setRecording(false);
    }
  };

  const stopRecognition = () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try {
        rec.onend = null;
        rec.stop();
      } catch {
        /* noop */
      }
    }
    setDraft((d) => d.trim());
  };

  useEffect(() => {
    if (recording) startRecognition();
    else stopRecognition();
    return () => stopRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setRecording(false);
      setSnap(0.55);
      setDraft("");
      setSendState("idle");
    }
  }, [open]);

  useEffect(() => {
    if (editing) {
      setSnap(0.95);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [editing]);

  if (!lead) return null;
  const { Icon } = lead;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
      snapPoints={[0.55, 0.95]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <DrawerContent
        className={cn(
          "border-white/10 bg-[#0b1220] text-white",
          "h-[95vh] transition-[height] duration-300 ease-out",
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
          <DrawerHeader className="text-left">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 ring-inset",
                  lead.iconTone,
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <DrawerTitle className="text-[17px] font-bold leading-tight text-white">
                    {lead.title}
                  </DrawerTitle>
                  <button
                    type="button"
                    onClick={cycleSize}
                    aria-label={`Text size: ${sizeKey}. Tap to change.`}
                    title="Adjust description text size"
                    className={cn(
                      "group relative inline-flex shrink-0 items-center gap-1 rounded-full",
                      "border border-white/10 bg-white/[0.04] px-2.5 py-1",
                      "text-[11px] font-semibold text-muted-foreground",
                      "transition hover:border-orange-glow/40 hover:text-orange-glow active:scale-95",
                    )}
                  >
                    <ALargeSmall className="h-3.5 w-3.5" strokeWidth={2.4} />
                    <span className="tabular-nums">{SIZE_LABEL[sizeKey]}</span>
                  </button>
                </div>
                <DrawerDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {lead.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {lead.postedAgo}
                  </span>
                  <span className="inline-flex items-center gap-1 text-orange-glow">
                    <Wallet className="h-3.5 w-3.5" /> €{lead.budgetEur}
                  </span>
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-6">
            <section
              onPointerDown={onDetailsPointerDown}
              onPointerMove={onDetailsPointerMove}
              onPointerUp={onDetailsPointerUp}
              onPointerCancel={onDetailsPointerUp}
              onClick={onDetailsClick}
              style={{ touchAction: "pan-y" }}
              className={cn(
                "select-text rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Job details
                </h4>
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {Math.round(fontPx)}px
                </span>
              </div>
              <p className="leading-relaxed text-slate-200/90" style={{ fontSize: `${fontPx}px` }}>
                {lead.details}
              </p>
              <p className="mt-3 text-[10.5px] italic text-muted-foreground/70">
                Tip: pinch to zoom, double-tap, or use the Aa button to resize.
              </p>
            </section>

            <section
              className={cn(
                "relative overflow-hidden rounded-2xl border border-orange-glow/25 p-5",
                "bg-gradient-to-br from-orange-glow/[0.08] via-orange-glow/[0.03] to-transparent",
              )}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-glow" />
                <h4 className="text-[13px] font-bold uppercase tracking-wider text-orange-glow">
                  AI Voice Quote
                </h4>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setRecording((v) => !v)}
                  aria-label={recording ? "Stop recording" : "Start recording"}
                  className={cn(
                    "relative grid h-16 w-16 shrink-0 place-items-center rounded-full",
                    "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
                    "shadow-[0_10px_30px_-8px_rgba(249,115,22,0.7)]",
                    "ring-4 ring-orange-glow/20 transition active:scale-95",
                  )}
                >
                  {recording && (
                    <>
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-orange-500/40 animate-ping"
                      />
                      <span
                        aria-hidden
                        className="absolute -inset-2 rounded-full ring-2 ring-orange-glow/40 animate-pulse"
                      />
                    </>
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full ring-2 ring-orange-glow/50"
                  />
                  <Mic className="relative h-7 w-7" strokeWidth={2.4} />
                </button>

                {recording && (
                  <div aria-hidden className="flex h-10 shrink-0 items-center gap-[3px]">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full bg-gradient-to-t from-orange-500 to-orange-glow"
                        style={{
                          animation: `wave 900ms ease-in-out ${i * 120}ms infinite`,
                          height: "40%",
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-white">
                    {recording ? "Listening…" : draft ? "Draft ready" : "Ready to record"}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                    {recording
                      ? "Transcribing your voice in real time…"
                      : "Speak your scope, price and timing. We handle the wording."}
                  </p>
                </div>
              </div>

              <style>{`@keyframes wave {
                0%, 100% { height: 20%; opacity: 0.6; }
                50% { height: 100%; opacity: 1; }
              }`}</style>

              <div
                role={editing ? undefined : "button"}
                tabIndex={editing ? -1 : 0}
                onClick={() => !editing && setEditing(true)}
                onKeyDown={(e) => {
                  if (!editing && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setEditing(true);
                  }
                }}
                className={cn(
                  "group relative mt-4 rounded-xl border border-dashed border-white/15 bg-slate-900/40 p-4",
                  "transition hover:border-orange-glow/40 focus:outline-none focus-visible:border-orange-glow/60",
                  !editing && "cursor-text",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Quotation draft
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {editing ? "Editing" : "Live preview"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing((v) => !v);
                      }}
                      aria-label={editing ? "Done editing" : "Edit draft manually"}
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-full border transition",
                        editing
                          ? "border-orange-glow/50 bg-orange-glow/15 text-orange-glow"
                          : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-orange-glow/40 hover:text-orange-glow",
                      )}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </button>
                  </div>
                </div>

                {editing ? (
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => {
                      if (!draft.trim()) setEditing(false);
                    }}
                    placeholder="Type your quotation here — scope, materials, price and timing…"
                    className={cn(
                      "min-h-[140px] w-full resize-none bg-transparent",
                      "text-[13px] leading-relaxed text-slate-100 placeholder:text-muted-foreground",
                      "focus:outline-none",
                    )}
                  />
                ) : (
                  <p
                    className={cn(
                      "text-[13px] leading-relaxed",
                      draft ? "text-slate-100" : "text-muted-foreground",
                    )}
                  >
                    {draft ||
                      "Tap the mic and speak naturally, or tap here to type manually. Our AI will format your message into a premium, professional quotation letter instantly."}
                    {recording && (
                      <span
                        aria-hidden
                        className="ml-0.5 inline-block h-[1em] w-[2px] -mb-[2px] animate-pulse bg-orange-glow align-middle"
                      />
                    )}
                  </p>
                )}
              </div>
            </section>

            <button
              type="button"
              disabled={!draft.trim() || recording || sendState !== "idle"}
              onClick={() => {
                setSendState("sending");
                setTimeout(() => setSendState("sent"), 1200);
              }}
              className={cn(
                "group relative flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4",
                "text-[14px] font-bold tracking-wide text-white",
                "transition-all duration-200 active:scale-[0.98]",
                "disabled:cursor-not-allowed disabled:opacity-40",
                sendState === "sent"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.6)]"
                  : draft.trim() && !recording
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_12px_36px_-10px_rgba(249,115,22,0.75)] ring-2 ring-orange-glow/40 hover:brightness-110 hover:shadow-[0_16px_40px_-8px_rgba(249,115,22,0.85)]"
                    : "bg-white/[0.05] ring-1 ring-inset ring-white/10",
              )}
            >
              {sendState === "sent" ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.6} />
                  Quotation sent
                </>
              ) : sendState === "sending" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Sending…
                </>
              ) : (
                <>
                  <Send
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.4}
                  />
                  Send Quotation · Angebot senden
                </>
              )}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
