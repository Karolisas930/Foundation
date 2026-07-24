/**
 * Phase 9 — Receipts Auto-Categorization (pure utilities).
 *
 * Keyword-driven mock classifier. Consumes the receipt/expense shape
 * unlocked in Phase 5 and returns a normalized category so downstream
 * exporters (Phase 11) can group entries without a live OCR call.
 */

export type ExpenseCategory =
  | "fuel"
  | "equipment"
  | "materials"
  | "office"
  | "meals"
  | "travel"
  | "other";

export type ReceiptInput = {
  id?: string;
  vendor?: string | null;
  description?: string | null;
  amount?: number | null;
  date?: string | null;
  category?: ExpenseCategory | string | null;
};

export type CategorizedReceipt = ReceiptInput & {
  category: ExpenseCategory;
  confidence: number;
  matchedKeyword: string | null;
};

const KEYWORD_MAP: ReadonlyArray<{
  keywords: readonly string[];
  category: ExpenseCategory;
}> = [
  {
    category: "fuel",
    keywords: [
      "diesel",
      "benzin",
      "petrol",
      "gas",
      "tank",
      "shell",
      "aral",
      "esso",
      "total",
      "fuel",
    ],
  },
  {
    category: "equipment",
    keywords: [
      "tool",
      "tools",
      "werkzeug",
      "drill",
      "saw",
      "bohrer",
      "ladder",
      "leiter",
      "equipment",
    ],
  },
  {
    category: "materials",
    keywords: [
      "obi",
      "bauhaus",
      "hornbach",
      "cement",
      "wood",
      "holz",
      "screw",
      "schraube",
      "paint",
      "farbe",
      "material",
    ],
  },
  {
    category: "office",
    keywords: [
      "office",
      "büro",
      "buero",
      "paper",
      "stapler",
      "printer",
      "toner",
      "ink",
      "stationery",
    ],
  },
  {
    category: "meals",
    keywords: [
      "restaurant",
      "cafe",
      "coffee",
      "lunch",
      "dinner",
      "bakery",
      "bäckerei",
      "food",
      "essen",
    ],
  },
  {
    category: "travel",
    keywords: [
      "hotel",
      "bahn",
      "db ",
      "train",
      "taxi",
      "uber",
      "flight",
      "flug",
      "parking",
      "parkhaus",
    ],
  },
];

function normalize(input: string | null | undefined): string {
  return (input ?? "").toLowerCase();
}

/** Classify a single free-text blob (vendor + description merged). */
export function categorizeText(text: string): {
  category: ExpenseCategory;
  confidence: number;
  matchedKeyword: string | null;
} {
  const haystack = normalize(text);
  if (!haystack.trim()) {
    return { category: "other", confidence: 0, matchedKeyword: null };
  }
  for (const rule of KEYWORD_MAP) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) {
        return { category: rule.category, confidence: 0.85, matchedKeyword: kw };
      }
    }
  }
  return { category: "other", confidence: 0.1, matchedKeyword: null };
}

/** Categorize one receipt, preserving any existing valid category. */
export function categorizeReceipt(receipt: ReceiptInput): CategorizedReceipt {
  const existing = receipt.category as ExpenseCategory | undefined;
  if (existing && isExpenseCategory(existing)) {
    return {
      ...receipt,
      category: existing,
      confidence: 1,
      matchedKeyword: null,
    };
  }
  const blob = `${receipt.vendor ?? ""} ${receipt.description ?? ""}`;
  const { category, confidence, matchedKeyword } = categorizeText(blob);
  return { ...receipt, category, confidence, matchedKeyword };
}

/** Bulk-categorize the Phase 5 receipts array. */
export function categorizeReceipts(receipts: readonly ReceiptInput[]): CategorizedReceipt[] {
  return receipts.map(categorizeReceipt);
}

/** Group already-categorized receipts by category and sum their amounts. */
export function summarizeByCategory(
  receipts: readonly CategorizedReceipt[],
): Record<ExpenseCategory, { count: number; total: number }> {
  const base: Record<ExpenseCategory, { count: number; total: number }> = {
    fuel: { count: 0, total: 0 },
    equipment: { count: 0, total: 0 },
    materials: { count: 0, total: 0 },
    office: { count: 0, total: 0 },
    meals: { count: 0, total: 0 },
    travel: { count: 0, total: 0 },
    other: { count: 0, total: 0 },
  };
  for (const r of receipts) {
    const bucket = base[r.category];
    bucket.count += 1;
    bucket.total += Number(r.amount ?? 0) || 0;
  }
  return base;
}

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return (
    value === "fuel" ||
    value === "equipment" ||
    value === "materials" ||
    value === "office" ||
    value === "meals" ||
    value === "travel" ||
    value === "other"
  );
}
