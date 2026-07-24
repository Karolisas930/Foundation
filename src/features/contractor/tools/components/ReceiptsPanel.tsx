/**
 * ReceiptsPanel — upload receipts to Supabase Storage, optionally OCR, list & delete.
 */
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Receipt, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOcr } from "@/features/contractor/tools/hooks/useOcr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Category = "material" | "tool" | "fuel" | "other";
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "material", label: "Material" },
  { value: "tool", label: "Tool" },
  { value: "fuel", label: "Fuel" },
  { value: "other", label: "Other" },
];

export interface ReceiptRow {
  id: string;
  receipt_date: string;
  vendor: string | null;
  amount_cents: number;
  category: Category;
  file_path: string | null;
  file_mime: string | null;
}

interface Props {
  userId: string;
  receipts: ReceiptRow[];
  onChange: () => void;
  autoOpenScanner?: boolean;
}

export function ReceiptsPanel({ userId, receipts, onChange, autoOpenScanner }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { scan, busy: ocrBusy } = useOcr();

  // When arriving via the "Scan Receipt" quick action (finanz?tab=receipts&scan=1)
  // open the file/camera picker automatically, once.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenScanner && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      // Defer so the panel is mounted and visible before the picker opens.
      const t = setTimeout(() => inputRef.current?.click(), 150);
      return () => clearTimeout(t);
    }
  }, [autoOpenScanner]);

  const [draft, setDraft] = useState({
    vendor: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    category: "material" as Category,
    file: null as File | null,
  });

  async function handleFilePicked(file: File) {
    setDraft((d) => ({ ...d, file }));
    if (!file.type.startsWith("image/")) return;
    try {
      const result = await scan(file);
      if (!result) return;
      setDraft((d) => ({
        ...d,
        vendor: result.vendor ?? d.vendor,
        amount: result.amount != null ? String(result.amount) : d.amount,
        date: result.date ?? d.date,
        category: (result.category as Category) ?? d.category,
      }));
      toast.success("Receipt scanned");
    } catch (err) {
      console.error(err);
      toast.error("Could not read receipt — fill in manually");
    }
  }

  async function handleSave() {
    if (!draft.file && !draft.amount) {
      toast.error("Attach a file or enter an amount");
      return;
    }
    setUploading(true);
    try {
      let filePath: string | null = null;
      let fileMime: string | null = null;
      if (draft.file) {
        const ext = draft.file.name.split(".").pop() || "bin";
        filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("receipts")
          .upload(filePath, draft.file, { contentType: draft.file.type });
        if (error) throw error;
        fileMime = draft.file.type;
      }
      const amountCents = Math.round(Number((draft.amount || "0").replace(",", ".")) * 100);
      const { error: insErr } = await supabase.from("receipts").insert({
        owner_id: userId,
        receipt_date: draft.date,
        vendor: draft.vendor || null,
        amount_cents: amountCents,
        category: draft.category,
        file_path: filePath,
        file_mime: fileMime,
      });
      if (insErr) throw insErr;
      setDraft({
        vendor: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        category: "material",
        file: null,
      });
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Receipt saved");
      onChange();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(row: ReceiptRow) {
    if (!confirm("Delete this receipt?")) return;
    if (row.file_path) {
      await supabase.storage.from("receipts").remove([row.file_path]);
    }
    const { error } = await supabase.from("receipts").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChange();
  }

  const total = receipts.reduce((s, r) => s + r.amount_cents, 0) / 100;

  return (
    <div className="space-y-4">
      {/* Upload card */}
      <div className="rounded-xl border border-white/10 bg-navy-deep/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-white">Add receipt</h4>
          {ocrBusy && (
            <span className="flex items-center gap-1 text-xs text-orange">
              <Loader2 className="h-3 w-3 animate-spin" /> Reading receipt…
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFilePicked(f);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Camera className="mr-2 h-4 w-4" /> Snap / attach
              </Button>
              {draft.file && (
                <span className="self-center truncate text-xs text-slate-300">
                  {draft.file.name}
                </span>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-300">Vendor</Label>
            <Input
              value={draft.vendor}
              onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
              className="border-white/15 bg-white/5 text-white"
              placeholder="Bauhaus, Shell, …"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-300">Amount (€)</Label>
            <Input
              inputMode="decimal"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              className="border-white/15 bg-white/5 text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-300">Date</Label>
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="border-white/15 bg-white/5 text-white"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-300">Category</Label>
            <Select
              value={draft.category}
              onValueChange={(v) => setDraft({ ...draft, category: v as Category })}
            >
              <SelectTrigger className="border-white/15 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={uploading}
            className="bg-orange text-navy-ink hover:bg-orange-glow"
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Save receipt
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-white/10 bg-navy-deep/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-white">Recent receipts</h4>
          <div className="text-sm text-slate-300">
            {receipts.length} ·{" "}
            {total.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
          </div>
        </div>
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Receipt className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No receipts yet. Snap your first one above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {receipts.map((r) => (
              <ReceiptRowView key={r.id} row={r} onDelete={() => handleDelete(r)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ReceiptRowView({ row, onDelete }: { row: ReceiptRow; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!row.file_path) return;
    supabase.storage
      .from("receipts")
      .createSignedUrl(row.file_path, 3600)
      .then(({ data }: { data: { signedUrl: string } | null }) => {
        if (alive && data) setUrl(data.signedUrl);
      });
    return () => {
      alive = false;
    };
  }, [row.file_path]);

  return (
    <li className="flex items-center gap-3 py-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {url && row.file_mime?.startsWith("image/") ? (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt="" className="h-full w-full object-cover" />
          </a>
        ) : url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-full w-full items-center justify-center text-orange"
          >
            PDF
          </a>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-500">
            <Receipt className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-white">{row.vendor ?? "Unknown vendor"}</div>
        <div className="text-xs text-slate-400">
          {row.receipt_date} · <span className="capitalize">{row.category}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white">
          {(row.amount_cents / 100).toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
          })}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="ml-2 text-slate-500 hover:text-destructive"
        aria-label="Delete receipt"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
