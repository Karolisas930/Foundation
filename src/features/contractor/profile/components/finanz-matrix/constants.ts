export const BASE_RECEIPTS_TOTAL = 4210;
export const BASE_RECEIPT_COUNT = 34;
export const BASE_RESERVE = 1430;
export const RESERVE_RATIO = BASE_RESERVE / BASE_RECEIPTS_TOTAL;

export const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);

export const EXPENSE_CATEGORIES: { id: string; label: string; sub: string; icon: string }[] = [
  { id: "materials", icon: "🛠️", label: "Materials & Equipment", sub: "Baustoffe, Werkzeuge" },
  {
    id: "fuel",
    icon: "⛽",
    label: "Fuel, Vehicle & Car Rental",
    sub: "Sprit, Kfz-Kosten, Mietwagen",
  },
  {
    id: "leasing",
    icon: "💳",
    label: "Vehicle Leasing & Financing",
    sub: "Leasingraten, Sonderzahlungen",
  },
  { id: "travel", icon: "✈️", label: "Travel, Lodging & Transit", sub: "Reisekosten, Hotel, Bahn" },
  { id: "office", icon: "🏢", label: "Office & Administrative", sub: "Bürobedarf, Telefon" },
  { id: "subs", icon: "👥", label: "Subcontractors & External Labor", sub: "Fremdleistungen" },
  { id: "insurance", icon: "🛡️", label: "Insurance & Fees", sub: "Versicherungen, Beiträge" },
  { id: "workwear", icon: "👟", label: "Protective Gear & Workwear", sub: "Arbeitskleidung, PSA" },
  { id: "training", icon: "🏫", label: "Training & Certifications", sub: "Fortbildung, Seminare" },
  { id: "hospitality", icon: "🍽️", label: "Hospitality & Catering", sub: "Bewirtungskosten" },
];

export function detectExpenseCategory(hint: string): string {
  const v = hint.toLowerCase();
  if (/(shell|aral|esso|jet|total|tank|bp |diesel|benzin|sprit|kfz|mietwagen)/.test(v))
    return "fuel";
  if (/(leasing|financing|kredit|raten)/.test(v)) return "leasing";
  if (/(db bahn|deutsche bahn|flixbus|uber|taxi|hotel|ibis|reise|bahn|flug|lufthansa)/.test(v))
    return "travel";
  if (
    /(hilti|makita|bosch|dewalt|milwaukee|werkzeug|tool|obi|bauhaus|hornbach|toom|hagebau|globus|baumarkt|baustoff|material)/.test(
      v,
    )
  )
    return "materials";
  if (/(subunternehmer|subcontract|fremdleistung|freelanc)/.test(v)) return "subs";
  if (/(versicherung|insurance|beitrag|ihk|hwk|kammer)/.test(v)) return "insurance";
  if (/(arbeitskleidung|workwear|engelbert|strauss|psa|schutz)/.test(v)) return "workwear";
  if (/(akademie|schule|seminar|fortbildung|training|zertifikat|kurs)/.test(v)) return "training";
  if (/(restaurant|café|cafe|gasthof|bewirtung|catering|hospitality)/.test(v)) return "hospitality";
  if (/(büro|office|staples|mediamarkt|saturn|amazon|telefon|telekom|vodafone|post|dhl)/.test(v))
    return "office";
  return "materials";
}

export type ScanEntry = {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  ts: number;
  invoice?: {
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    laborAmount: number;
    materialAmount: number;
    contractorName: string;
  };
};
