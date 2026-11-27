import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchCompanies, type CompanyDetails } from "@/lib/company-lookup";

interface Props {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (company: CompanyDetails) => void;
  countryCode?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

export function CompanyLookup({ id, name, value, onChange, onSelect, countryCode = "DE", required, maxLength = 160, placeholder, className }: Props) {
  const [results, setResults] = useState<CompanyDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    controller.current?.abort();
    setResults([]);
    setMessage("");
    setLoading(false);
  }, [value, countryCode]);
  useEffect(() => () => controller.current?.abort(), []);

  async function search() {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setMessage("");
    setResults([]);
    try {
      const companies = await searchCompanies(value, countryCode, request.signal);
      if (request.signal.aborted) return;
      setResults(companies);
      if (!companies.length) setMessage("No matching companies found. You can enter your details manually.");
    } catch {
      if (!request.signal.aborted) setMessage("Company search is unavailable. You can enter your details manually.");
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input id={id} name={name} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="organization" required={required} maxLength={maxLength} placeholder={placeholder} className={className}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              if (value.trim().length >= 3 && !loading) void search();
            }
            if (event.key === "Escape") { setResults([]); setMessage(""); }
          }}
        />
        <Button type="button" variant="outline" size="icon" aria-label="Search companies" title="Search companies" disabled={loading || value.trim().length < 3} onClick={() => void search()} className="shrink-0">
          {loading ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Search className="size-4" />}
        </Button>
      </div>
      {loading && <p role="status" className="text-xs text-muted-foreground">Searching companies…</p>}
      {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
      {results.length > 0 && (
        <div className="max-h-64 overflow-auto rounded-md border border-border bg-popover text-popover-foreground">
          <ul aria-label="Matching companies" className="divide-y divide-border">
            {results.map((company) => (
              <li key={company.id}>
                <Button type="button" variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-none px-3 py-3 text-left" onClick={() => { onChange(company.name); onSelect(company); setResults([]); }}>
                  <span className="min-w-0 break-words"><span className="block font-medium">{company.name}</span><span className="mt-1 block text-xs text-muted-foreground">{company.address}</span></span>
                </Button>
              </li>
            ))}
          </ul>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="block border-t border-border px-3 py-2 text-xs text-muted-foreground underline">© OpenStreetMap contributors</a>
        </div>
      )}
    </div>
  );
}