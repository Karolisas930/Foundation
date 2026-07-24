/**
 * MeisterVerification — safe document upload for Meisterbrief /
 * Handwerksrolle extract. Self-uploaded; HANDWERK does not perform
 * official Handwerkskammer verification.
 */
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

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

type DocKind = "meisterbrief" | "handwerksrolle" | "other";

type MeisterDoc = {
  id: string;
  fileName: string;
  mime: string;
  size: number;
  kind: DocKind;
  issuer: string;
  issuedOn: string;
  uploadedAt: string;
  dataUrl: string; // small previews only; large files stored as marker
};

const KEY = "handyman.meisterDocs.v1";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file
const uid = () => Math.random().toString(36).slice(2, 10);

function loadDocs(): MeisterDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MeisterDoc[]) : [];
  } catch {
    return [];
  }
}

function saveDocs(docs: MeisterDoc[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(docs));
  } catch {
    /* quota — silently ignore */
  }
}

export function MeisterVerification() {
  const [docs, setDocs] = useState<MeisterDoc[]>([]);
  const [kind, setKind] = useState<DocKind>("meisterbrief");
  const [issuer, setIssuer] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDocs(loadDocs()), []);
  useEffect(() => saveDocs(docs), [docs]);

  const provided = docs.length > 0;

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ""));
      r.onerror = () => reject(new Error("Could not read file."));
      r.readAsDataURL(file);
    });
  }

  async function onPick(files?: FileList | null) {
    if (!files?.length) return;
    const accepted: MeisterDoc[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is over 8 MB — please compress and try again.`);
        continue;
      }
      const okType = f.type === "application/pdf" || f.type.startsWith("image/");
      if (!okType) {
        toast.error(`${f.name}: only PDF or image files are accepted.`);
        continue;
      }
      try {
        const dataUrl = await readFile(f);
        accepted.push({
          id: uid(),
          fileName: f.name,
          mime: f.type,
          size: f.size,
          kind,
          issuer: issuer.trim(),
          issuedOn,
          uploadedAt: new Date().toISOString(),
          dataUrl,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      }
    }
    if (accepted.length) {
      setDocs((d) => [...accepted, ...d]);
      toast.success(`${accepted.length} document${accepted.length === 1 ? "" : "s"} uploaded`, {
        description: "Status set to Documents provided.",
      });
      setIssuer("");
      setIssuedOn("");
    }
  }

  function remove(id: string) {
    setDocs((d) => d.filter((x) => x.id !== id));
  }

  return (
    <section
      id="pro-meister-verification"
      className="mx-2 mt-6 scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-sm sm:mx-4"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/15 text-orange">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-white">
              Meister / Handwerksrolle verification
            </h3>
            {provided ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                <CheckCircle2 className="mr-1 inline size-3" /> Documents provided
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                Pending review
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Upload your Meisterbrief or Handwerksrolle extract (PDF or photo). We review uploads
            quickly and show a "Documents provided" badge on your profile.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-slate-400">
                Document type
              </Label>
              <Select value={kind} onValueChange={(v) => setKind(v as DocKind)}>
                <SelectTrigger className="intake-input mt-1.5 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meisterbrief">Meisterbrief</SelectItem>
                  <SelectItem value="handwerksrolle">Handwerksrolle extract</SelectItem>
                  <SelectItem value="other">Other credential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-slate-400">
                Issuing chamber / authority (optional)
              </Label>
              <Input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. Handwerkskammer München"
                className="intake-input mt-1.5 h-10"
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-slate-400">
                Issue date
              </Label>
              <Input
                type="date"
                value={issuedOn}
                onChange={(e) => setIssuedOn(e.target.value)}
                className="intake-input mt-1.5 h-10"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-slate-300 transition-all hover:border-orange/60 hover:bg-white/[0.06] active:scale-[0.99]"
          >
            <div className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/5 text-orange">
              <Upload className="size-4" />
            </div>
            <span className="text-sm font-semibold text-white">
              Upload Meisterbrief or Handwerksrolle
            </span>
            <span className="text-[11px] text-slate-500">
              PDF or photo · max 8 MB · stored privately on your device
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />

          {docs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2"
                >
                  <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-800 text-slate-400">
                    {d.mime.startsWith("image/") ? (
                      <img
                        src={d.dataUrl}
                        alt={d.fileName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{d.fileName}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {d.kind === "meisterbrief"
                        ? "Meisterbrief"
                        : d.kind === "handwerksrolle"
                          ? "Handwerksrolle"
                          : "Credential"}
                      {d.issuer ? ` · ${d.issuer}` : ""}
                      {d.issuedOn ? ` · issued ${d.issuedOn}` : ""}
                      {" · "}
                      {(d.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <a
                    href={d.dataUrl}
                    download={d.fileName}
                    className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange hover:bg-orange/10"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(d.id)}
                    className="grid size-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-white/5 hover:text-rose-300"
                    aria-label="Remove document"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-relaxed text-amber-200/90">
            <AlertTriangle className="mr-1 inline size-3" />
            <strong>Disclaimer:</strong> Automatic verification isn't possible yet (no official
            public API from the Handwerkskammer). Upload your documents here — we review them
            quickly. The badge confirms submitted documents only. You are responsible for the
            accuracy and authenticity of what you upload.
          </p>
        </div>
      </div>
    </section>
  );
}

export default MeisterVerification;
