import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addSiteDiaryEntry,
  removeSiteDiaryEntry,
  type SiteDiaryEntry,
} from "@/features/contractor/team/site-diary-store";
import { formatTs } from "./utils";

export function SignaturePanel({
  job,
  entries,
}: {
  job: { id: string; title: string };
  entries: SiteDiaryEntry[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [signerName, setSignerName] = useState("");
  const [empty, setEmpty] = useState(true);

  const items = entries.filter((e) => e.kind === "signature");

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    function fit() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      const snapshot = canvas.toDataURL();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffffff";
      if (snapshot.startsWith("data:image") && !snapshot.endsWith(",")) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = snapshot;
      }
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setEmpty(false);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function up() {
    drawingRef.current = false;
  }

  function clear() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
  }

  function save() {
    const c = canvasRef.current;
    if (!c || empty) {
      toast.error("Please sign first");
      return;
    }
    const dataUrl = c.toDataURL("image/png");
    addSiteDiaryEntry({
      jobId: job.id,
      jobTitle: job.title,
      kind: "signature",
      dataUrl,
      signerName: signerName.trim() || "Customer",
    });
    clear();
    setSignerName("");
    toast.success("Signature saved");
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
          Customer name
        </label>
        <Input
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="e.g. Jane Smith"
          className="mt-1 border-white/10 bg-white/[0.04] text-white placeholder:text-white/40"
        />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="h-64 w-full touch-none rounded-xl bg-[#111418] cursor-crosshair"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-white/50">Sign above with a finger or stylus</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
              className="text-white/70 hover:bg-white/[0.06] hover:text-white"
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={save}
              className="bg-orange text-black hover:bg-orange/90"
            >
              Save sign-off
            </Button>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
          >
            <div className="h-12 w-24 shrink-0 overflow-hidden rounded-lg bg-[#111418]">
              {e.dataUrl ? (
                <img src={e.dataUrl} alt="Signature" className="h-full w-full object-contain" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/90">
                {e.signerName ?? "Customer"}
              </p>
              <p className="mt-0.5 text-[11px] text-white/55">{formatTs(e.createdAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => removeSiteDiaryEntry(e.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-white/[0.08] hover:text-red-300"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
