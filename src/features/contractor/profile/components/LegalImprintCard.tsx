import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Legal = {
  company: string;
  director: string;
  register: string;
  vat: string;
  responsible: string;
};

const FIELDS: { key: keyof Legal; label: string; ph: string }[] = [
  { key: "company", label: "Company", ph: "Muster GmbH" },
  { key: "director", label: "Managing Director", ph: "Max Mustermann" },
  { key: "register", label: "Commercial Register No.", ph: "HRB 12345, Amtsgericht Stuttgart" },
  { key: "vat", label: "VAT ID", ph: "DE123456789" },
  { key: "responsible", label: "Responsible for Content (acc. to § 55 Abs. 2 RStV)", ph: "Max Mustermann" },
];

/** Impressum card — the signed-in owner can tap Edit to fill in their legal details. */
export function LegalImprintCard({ defaultCompany, defaultName }: { defaultCompany: string; defaultName: string }) {
  const [uid, setUid] = useState<string | null>(null);
  const [legal, setLegal] = useState<Legal>({ company: "", director: "", register: "", vat: "", responsible: "" });
  const [draft, setDraft] = useState<Legal>(legal);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const id = s?.session?.user?.id;
      if (!id) return;
      setUid(id);
      const { data } = await supabase.from("profiles").select("legal_info").eq("id", id).maybeSingle();
      const li = ((data as { legal_info?: Partial<Legal> } | null)?.legal_info ?? {}) as Partial<Legal>;
      setLegal((p) => ({ ...p, ...li }));
    })();
  }, []);

  const shown: Legal = {
    company: legal.company || defaultCompany,
    director: legal.director || defaultName,
    register: legal.register,
    vat: legal.vat,
    responsible: legal.responsible || defaultName,
  };

  const save = async () => {
    if (!uid) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ legal_info: draft } as never).eq("id", uid);
    setSaving(false);
    if (error) {
      toast.error(`Couldn't save: ${error.message}`);
      return;
    }
    setLegal(draft);
    setEditing(false);
    toast.success("Legal details saved");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-slate-200">
        <FileText className="size-4 text-orange" />
        <h3 className="flex-1 font-display text-sm font-extrabold uppercase tracking-wider">
          Legal Disclosure &amp; Imprint
        </h3>
        {uid && !editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(shown);
              setEditing(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold text-orange-300"
          >
            <Pencil className="size-3" /> Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{f.label}</span>
              <input
                value={draft[f.key]}
                placeholder={f.ph}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="flex-1 rounded-lg bg-orange px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <dl className="grid gap-x-4 gap-y-2 text-xs text-slate-300 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === "responsible" ? "sm:col-span-2" : ""}>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{f.label}</dt>
              <dd className="break-words text-slate-200">{shown[f.key] || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
        Information pursuant to § 5 TMG. Dispute Resolution: The European Commission provides a platform for
        online dispute resolution (OS):{" "}
        <a href="https://ec.europa.eu/consumers/odr" className="text-orange-300 underline" target="_blank" rel="noreferrer">
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>
    </div>
  );
}
