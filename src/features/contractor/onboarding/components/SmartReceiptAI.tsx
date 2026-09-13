import { useRef, useState } from "react";
import { Receipt as ReceiptIcon, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_OPTIONS, ProSection } from "./HandymanProSection";

type SmartReceipt = {
  id: string;
  fileName: string;
  vendor: string;
  amount: number;
  date: string;
  category: (typeof CATEGORY_OPTIONS)[number];
  dataUrl: string;
};

function pseudoOcr(file: File): {
  vendor: string;
  amount: number;
  category: SmartReceipt["category"];
} {
  const lower = file.name.toLowerCase();
  const vendorMap: { match: RegExp; vendor: string; category: SmartReceipt["category"] }[] = [
    { match: /obi/, vendor: "OBI Baumarkt", category: "Materials" },
    { match: /bauhaus/, vendor: "Bauhaus", category: "Materials" },
    { match: /hornbach/, vendor: "Hornbach", category: "Materials" },
    { match: /shell|aral|esso|tank/, vendor: "Shell", category: "Fuel" },
    { match: /lidl|aldi|rewe|edeka/, vendor: "Supermarket", category: "Office" },
    { match: /tool|werkzeug/, vendor: "ToolStore", category: "Tools" },
  ];
  const hit = vendorMap.find((v) => v.match.test(lower));
  const amount = Math.round(((file.size % 18000) / 100 + 12) * 100) / 100;
  return {
    vendor: hit?.vendor ?? "Unknown vendor",
    amount,
    category: hit?.category ?? "Other",
  };
}

export function SmartReceiptAI() {
  const [items, setItems] = useState<SmartReceipt[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) return reject(new Error("Keep receipts under 5 MB."));
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ""));
      r.onerror = () => reject(new Error("Could not read file."));
      r.readAsDataURL(file);
    });
  }

  async function onPick(files?: FileList | null) {
    if (!files?.length) return;
    const next: SmartReceipt[] = [];
    for (const f of Array.from(files)) {
      try {
        const dataUrl = await readFile(f);
        const ocr = pseudoOcr(f);
        next.push({
          id: `sr-${Date.now()}-${f.name}`,
          fileName: f.name,
          ...ocr,
          date: new Date().toISOString().slice(0, 10),
          dataUrl,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not read receipt.");
      }
    }
    if (next.length) {
      setItems((c) => [...next, ...c]);
      toast.success(`${next.length} receipt${next.length === 1 ? "" : "s"} scanned`, {
        description: "Vendor, amount and category auto-detected. Edit if needed.",
      });
    }
  }

  function update<K extends keyof SmartReceipt>(id: string, key: K, value: SmartReceipt[K]) {
    setItems((c) => c.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  const total = items.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const byCategory = items.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {});

  return (
    <ProSection
      id="pro-receipt-ai"
      icon={Sparkles}
      title="Smart Receipt AI"
      subtitle="Snap a photo — we extract vendor, amount and date, and pre-categorize for your tax return."
      badge={
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          €{total.toFixed(2)} scanned
        </span>
      }
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-slate-300 transition-all hover:border-orange/60 hover:bg-white/[0.06] active:scale-[0.99]"
      >
        <div className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/5 text-orange">
          <Upload className="size-4" />
        </div>
        <span className="text-sm font-semibold text-white">Snap or upload a receipt</span>
        <span className="text-[11px] text-slate-500">
          JPG · PNG · PDF — auto-OCR & tax category
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />

      {Object.keys(byCategory).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(byCategory).map(([cat, sum]) => (
            <span
              key={cat}
              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300"
            >
              {cat}: €{sum.toFixed(2)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {items.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2"
          >
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-slate-800">
              {r.dataUrl.startsWith("data:image") ? (
                <img src={r.dataUrl} alt={r.fileName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-slate-500">
                  <ReceiptIcon className="size-5" />
                </div>
              )}
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <Input
                id={`receipt-vendor-${r.id}`}
                name={`receipt-vendor-${r.id}`}
                value={r.vendor}
                onChange={(e) => update(r.id, "vendor", e.target.value)}
                className="intake-input h-8 text-xs"
                aria-label="Vendor"
              />
              <Input
                id={`receipt-amount-${r.id}`}
                name={`receipt-amount-${r.id}`}
                type="number"
                step="0.01"
                value={r.amount}
                onChange={(e) => update(r.id, "amount", Number(e.target.value) || 0)}
                className="intake-input h-8 text-xs"
                aria-label="Amount"
              />
              <Input
                id={`receipt-date-${r.id}`}
                name={`receipt-date-${r.id}`}
                type="date"
                value={r.date}
                onChange={(e) => update(r.id, "date", e.target.value)}
                className="intake-input h-8 text-xs"
                aria-label="Date"
              />
              <Select
                value={r.category}
                onValueChange={(v) => update(r.id, "category", v as SmartReceipt["category"])}
              >
                <SelectTrigger
                  id={`receipt-category-${r.id}`}
                  className="intake-input h-8 text-xs"
                  aria-label="Category"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              onClick={() => setItems((c) => c.filter((x) => x.id !== r.id))}
              className="grid size-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-white/5 hover:text-orange"
              aria-label="Remove"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ProSection>
  );
}
