import { useMemo, useState } from "react";
import { Package } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { ProSection } from "./HandymanProSection";

const PRICE_DB: { match: RegExp; price: number; unit: string }[] = [
  { match: /tile|fliese/i, price: 28, unit: "m²" },
  { match: /primer|grundier/i, price: 24, unit: "5L" },
  { match: /paint|farbe|lack/i, price: 42, unit: "10L" },
  { match: /cement|zement|mortar|mörtel/i, price: 18, unit: "25kg" },
  { match: /grout|fugen/i, price: 14, unit: "5kg" },
  { match: /silicone|silikon/i, price: 9, unit: "tube" },
  { match: /screw|schraube/i, price: 8, unit: "pack" },
  { match: /pipe|rohr/i, price: 22, unit: "m" },
  { match: /cable|kabel/i, price: 1.8, unit: "m" },
  { match: /drywall|gipskarton|rigips/i, price: 12, unit: "sheet" },
  { match: /insulation|dämm/i, price: 38, unit: "pack" },
];

function priceFor(line: string): { price: number; unit: string } {
  const hit = PRICE_DB.find((p) => p.match.test(line));
  if (hit) return { price: hit.price, unit: hit.unit };
  return { price: Math.round((line.length * 1.3 + 8) * 100) / 100, unit: "item" };
}

export function MaterialComparator() {
  const [raw, setRaw] = useState(
    "12 m² ceramic tile\n2 tubes silicone\n1 bag tile adhesive\n5 m drainage pipe",
  );

  const rows = useMemo(() => {
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const qtyMatch = line.match(/^(\d+(?:\.\d+)?)/);
        const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
        const { price, unit } = priceFor(line);
        return { line, qty, unitPrice: price, unit, total: +(qty * price).toFixed(2) };
      });
  }, [raw]);

  const grand = rows.reduce((s, r) => s + r.total, 0);

  return (
    <ProSection
      id="pro-materials"
      icon={Package}
      title="Material List Comparator"
      subtitle="Paste a material list (one per line). We estimate cost based on common supplier prices."
      badge={
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          €{grand.toFixed(2)} est.
        </span>
      }
    >
      <Textarea
        id="material-list-input"
        name="material-list-input"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={
          "One item per line — start with quantity\n12 m² ceramic tile\n3 tubes silicone"
        }
        className="intake-input min-h-[120px] font-mono text-xs"
      />
      <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-xs">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">€/unit</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="px-3 py-2 text-white">{r.line}</td>
                <td className="px-3 py-2 text-right text-slate-300">{r.qty}</td>
                <td className="px-3 py-2 text-right text-slate-300">
                  €{r.unitPrice.toFixed(2)} / {r.unit}
                </td>
                <td className="px-3 py-2 text-right font-bold text-emerald-300">
                  €{r.total.toFixed(2)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                  Add items above to compare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ProSection>
  );
}
