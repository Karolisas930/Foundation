/**
 * ArchitectForm — Architecture & Building Control planning-office onboarding.
 *
 * This is the canonical architect profile layout (formerly mounted at
 * `/register-planning`). It is rendered by the `/onboarding/architect` route
 * via `OnboardingPage`. On submit it persists the profile into the Chameleon
 * Ecosystem Ledger through `persistOnboardingProfile` (which calls
 * `updateEcosystemLedger`) with a sector value of "architect", then pushes to
 * the dynamic chameleon dashboard at `/contractor`.
 */
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopBar } from "@/components/shared/TopBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { startDemoSession } from "@/core/demo-session";
import { persistOnboardingProfile } from "@/components/shared/shared";

type PostalEntry = { match: RegExp; city: string; state: string };
type CountryEntry = {
  code: string;
  name: string;
  flag: string;
  phonePlaceholder: string;
  postal: PostalEntry[];
};

const COUNTRIES: CountryEntry[] = [
  { code: "AT", name: "Austria", flag: "🇦🇹", phonePlaceholder: "0664 123 4567", postal: [] },
  { code: "BE", name: "Belgium", flag: "🇧🇪", phonePlaceholder: "04XX XX XX XX", postal: [] },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", phonePlaceholder: "07X XXX XX XX", postal: [] },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    phonePlaceholder: "017X XXX XXXX",
    postal: [
      { match: /^10\d{3}$/, city: "Berlin", state: "Berlin" },
      { match: /^20\d{3}$/, city: "Hamburg", state: "Hamburg" },
      { match: /^50\d{3}$/, city: "Köln", state: "Nordrhein-Westfalen" },
      { match: /^68\d{3}$/, city: "Mannheim", state: "Baden-Württemberg" },
      { match: /^80\d{3}$/, city: "München", state: "Bayern" },
    ],
  },
  { code: "DK", name: "Denmark", flag: "🇩🇰", phonePlaceholder: "20 12 34 56", postal: [] },
  { code: "ES", name: "Spain", flag: "🇪🇸", phonePlaceholder: "612 34 56 78", postal: [] },
  { code: "FR", name: "France", flag: "🇫🇷", phonePlaceholder: "06 12 34 56 78", postal: [] },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", phonePlaceholder: "07XXX XXXXXX", postal: [] },
  { code: "IT", name: "Italy", flag: "🇮🇹", phonePlaceholder: "312 345 6789", postal: [] },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", phonePlaceholder: "612 34 567", postal: [] },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", phonePlaceholder: "06 1234 5678", postal: [] },
  { code: "PL", name: "Poland", flag: "🇵🇱", phonePlaceholder: "512 345 678", postal: [] },
  { code: "PT", name: "Portugal", flag: "🇵🇹", phonePlaceholder: "912 345 678", postal: [] },
  { code: "RO", name: "Romania", flag: "🇷🇴", phonePlaceholder: "0712 345 678", postal: [] },
  { code: "SE", name: "Sweden", flag: "🇸🇪", phonePlaceholder: "070 123 45 67", postal: [] },
];

const COUNTRY_CAPITAL_FALLBACK: Record<string, { city: string; state: string }> = {
  AT: { city: "Vienna", state: "Vienna" },
  BE: { city: "Brussels", state: "Brussels-Capital" },
  CH: { city: "Bern", state: "Canton of Bern" },
  DE: { city: "Berlin", state: "Berlin" },
  DK: { city: "Copenhagen", state: "Capital Region" },
  ES: { city: "Madrid", state: "Community of Madrid" },
  FR: { city: "Paris", state: "Île-de-France" },
  GB: { city: "London", state: "England" },
  IT: { city: "Rome", state: "Lazio" },
  LT: { city: "Vilnius", state: "Vilnius County" },
  NL: { city: "Amsterdam", state: "North Holland" },
  PL: { city: "Warsaw", state: "Masovian" },
  PT: { city: "Lisbon", state: "Lisbon" },
  RO: { city: "Bucharest", state: "Ilfov" },
  SE: { city: "Stockholm", state: "Stockholm County" },
};

const SPECIALIZATIONS = [
  "Residential",
  "Commercial",
  "Structural Analysis / Statik",
  "Historic Preservation",
  "Interior Architecture",
  "Others",
];

function lookupPostalCode(countryCode: string, plz: string) {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return null;
  return country.postal.find((entry) => entry.match.test(plz)) ?? null;
}

export function ArchitectForm() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firm, setFirm] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [chamberNumber, setChamberNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [specOpen, setSpecOpen] = useState(false);
  const [specSearch, setSpecSearch] = useState("");

  const [country, setCountry] = useState("DE");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("Berlin");
  const [stateRegion, setStateRegion] = useState("Berlin");
  const [autoFilled, setAutoFilled] = useState(true);

  const currentCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0],
    [country],
  );

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return COUNTRIES.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [countrySearch]);

  const filteredSpecs = useMemo(() => {
    const q = specSearch.trim().toLowerCase();
    return SPECIALIZATIONS.filter((s) => !q || s.toLowerCase().includes(q));
  }, [specSearch]);

  useEffect(() => {
    const hit = lookupPostalCode(country, postalCode);
    if (hit) {
      setCity(hit.city);
      setStateRegion(hit.state);
      setAutoFilled(true);
    } else setAutoFilled(false);
  }, [postalCode, country]);

  function handleCountrySelect(code: string) {
    setCountry(code);
    setCountryOpen(false);
    setCountrySearch("");
    setPostalCode("");
    const fb = COUNTRY_CAPITAL_FALLBACK[code];
    if (fb) {
      setCity(fb.city);
      setStateRegion(fb.state);
      setAutoFilled(true);
    } else {
      setCity("");
      setStateRegion("");
      setAutoFilled(false);
    }
  }

  function handleCountryKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && filteredCountries.length === 1) {
      e.preventDefault();
      handleCountrySelect(filteredCountries[0].code);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!chamberNumber.trim()) {
      toast.error("Architektenkammer-Nummer is required");
      return;
    }
    // Persist the architect profile into the Chameleon Ecosystem Ledger.
    persistOnboardingProfile("architect", {
      firstName,
      lastName,
      firm,
      email,
      teamSize,
      chamberNumber,
      specialization,
      country,
      phone,
      postalCode,
      city,
      stateRegion,
    });
    // Architect rides on the admin sector slot so the dashboard router can
    // preview the architect sector panel.
    startDemoSession("admin");
    toast.success("Welcome to your dashboard", {
      description: `${firm || "Your firm"} — session active.`,
    });
    navigate({ to: "/contractor" });
  }

  return (
    <div className="min-h-screen bg-[#0f172a] intake-grid text-slate-50">
      <TopBar />

      <main className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
        {/* Registration header rows */}
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">
          PHASE 1 REGISTRATION
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          Architecture &amp; Building Control profile
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Register your professional planning firm, upload design credentials, and track local
          structural permit approvals.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Card 1 — Company & Personal Details */}
          <section className="rounded-lg border border-border/70 bg-card p-5">
            <h2 className="font-display text-base font-extrabold">
              Company &amp; Personal Details
            </h2>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field id="firstName" label="First Name">
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Anna"
                  />
                </Field>
                <Field id="lastName" label="Last Name">
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Schmidt"
                  />
                </Field>
              </div>
              <Field id="firm" label="Architecture Firm / Company Name">
                <Input
                  id="firm"
                  value={firm}
                  onChange={(e) => setFirm(e.target.value)}
                  placeholder="Schmidt Architekten GmbH"
                />
              </Field>
              <div className="flex items-end gap-3">
                <div className="w-[70%]">
                  <Field id="email" label="Business email address">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@firm.eu"
                    />
                  </Field>
                </div>
                <div className="w-[30%]">
                  <Field id="teamSize" label="Office Team Size">
                    <Select value={teamSize} onValueChange={setTeamSize}>
                      <SelectTrigger id="teamSize">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 (Solo)</SelectItem>
                        <SelectItem value="2-5">2–5</SelectItem>
                        <SelectItem value="6-15">6–15</SelectItem>
                        <SelectItem value="16-50">16–50</SelectItem>
                        <SelectItem value="50+">50+</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2 — Professional Credentials Gate */}
          <section className="rounded-lg border border-border/70 bg-card p-5">
            <h2 className="font-display text-base font-extrabold">Professional Credentials Gate</h2>
            <div className="mt-4 space-y-3">
              <Field
                id="chamber"
                label="Chamber of Architects Registration Number / Architektenkammer-Nummer *"
              >
                <Input
                  id="chamber"
                  required
                  value={chamberNumber}
                  onChange={(e) => setChamberNumber(e.target.value)}
                  placeholder="e.g. BY-A-12345"
                />
              </Field>
              <Field id="spec" label="Primary Focus / Specialization">
                <Popover open={specOpen} onOpenChange={setSpecOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className={cn(!specialization && "text-muted-foreground")}>
                        {specialization || "Select specialization"}
                      </span>
                      <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
                      <Search className="size-4 text-muted-foreground" />
                      <input
                        autoFocus
                        value={specSearch}
                        onChange={(e) => setSpecSearch(e.target.value)}
                        placeholder="Search…"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <ul className="max-h-60 overflow-y-auto py-1">
                      {filteredSpecs.length === 0 && (
                        <li className="px-3 py-2 text-xs text-muted-foreground">No match</li>
                      )}
                      {filteredSpecs.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onClick={() => {
                              setSpecialization(s);
                              setSpecOpen(false);
                              setSpecSearch("");
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            {s}
                            {specialization === s && <Check className="size-4 text-orange" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              </Field>
            </div>
          </section>

          {/* Card 3 — Address & Contact Matrix */}
          <section className="rounded-lg border border-border/70 bg-card p-5">
            <h2 className="font-display text-base font-extrabold">Address &amp; Contact Matrix</h2>
            <div className="mt-4 space-y-3">
              <Field id="country" label="Country">
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden>{currentCountry.flag}</span>
                        <span>{currentCountry.name}</span>
                      </span>
                      <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
                      <Search className="size-4 text-muted-foreground" />
                      <input
                        autoFocus
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        onKeyDown={handleCountryKey}
                        placeholder="Search country…"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <ul className="max-h-60 overflow-y-auto py-1">
                      {filteredCountries.length === 0 && (
                        <li className="px-3 py-2 text-xs text-muted-foreground">No match</li>
                      )}
                      {filteredCountries.map((c) => (
                        <li key={c.code}>
                          <button
                            type="button"
                            onClick={() => handleCountrySelect(c.code)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <span className="flex items-center gap-2">
                              <span aria-hidden>{c.flag}</span>
                              <span>{c.name}</span>
                            </span>
                            {country === c.code && <Check className="size-4 text-orange" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              </Field>

              <Field id="phone" label="Mobile phone">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted px-2.5 py-2 text-sm">
                    <span aria-hidden>{currentCountry.flag}</span>
                    <span className="text-muted-foreground">{currentCountry.code}</span>
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={currentCountry.phonePlaceholder}
                    className="flex-1"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field id="plz" label="Postal Code">
                  <Input
                    id="plz"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="10115"
                  />
                </Field>
                <Field id="city" label="City">
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setAutoFilled(false);
                    }}
                  />
                </Field>
                <Field id="state" label="State / Region">
                  <Input
                    id="state"
                    value={stateRegion}
                    onChange={(e) => {
                      setStateRegion(e.target.value);
                      setAutoFilled(false);
                    }}
                  />
                </Field>
              </div>
              {autoFilled && (
                <p className="text-[11px] text-muted-foreground">
                  Auto-filled from postcode lookup — edit if needed.
                </p>
              )}
            </div>
          </section>

          <div className="flex items-center justify-between pt-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">← Back home</Link>
            </Button>
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="rounded-full px-6 font-bold"
            >
              Submit registration
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default ArchitectForm;
