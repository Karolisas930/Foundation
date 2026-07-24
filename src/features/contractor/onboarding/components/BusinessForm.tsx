/**
 * BusinessForm — corporate / B2B contractor onboarding.
 * All field labels use proper corporate titles (no i18n key placeholders).
 */
import { FormEvent, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startDemoSession } from "@/core/demo-session";
import { FormShell } from "@/components/shared/FormShell";
import { persistOnboardingProfile } from "@/components/shared/shared";

const TEAM_SIZE_OPTIONS = ["1", "2 – 5", "6 – 10", "11 – 20", "21 – 50", "50+"];

export function BusinessForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const profile = {
      legalCompanyName: String(fd.get("legalCompanyName") ?? "").trim(),
      commercialRegistryNumber: String(fd.get("commercialRegistryNumber") ?? "").trim(),
      taxId: String(fd.get("taxId") ?? "").trim(),
      vatId: String(fd.get("vatId") ?? "").trim(),
      managingDirectorFirstName: String(fd.get("managingDirectorFirstName") ?? "").trim(),
      managingDirectorLastName: String(fd.get("managingDirectorLastName") ?? "").trim(),
      corporateEmail: String(fd.get("corporateEmail") ?? "")
        .trim()
        .toLowerCase(),
      companyPhone: String(fd.get("companyPhone") ?? "").trim(),
      teamSize: String(fd.get("teamSize") ?? "").trim(),
      headquartersCity: String(fd.get("headquartersCity") ?? "").trim(),
      headquartersPostalCode: String(fd.get("headquartersPostalCode") ?? "").trim(),
    };
    if (!profile.legalCompanyName || !profile.taxId) {
      toast.error("Legal company name and Tax ID are required.");
      return;
    }
    if (!profile.corporateEmail || !profile.companyPhone) {
      toast.error("Corporate contact details are required.");
      return;
    }
    setSubmitting(true);
    persistOnboardingProfile("business", profile);
    startDemoSession("business");
    toast.success("Corporate profile saved.");
    await navigate({ to: "/contractor", replace: true });
  }

  return (
    <FormShell
      eyebrow="Profile · Corporate"
      title="Business onboarding"
      subtitle="Register your company so corporate jobs, fleet, and supplier accounts can be linked to your team."
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <section>
          <h2 className="font-display text-base font-semibold text-navy">
            Commercial Business Identity
          </h2>
          <div className="mt-3 space-y-4">
            <div>
              <Label htmlFor="legalCompanyName">Legal Company Name</Label>
              <Input
                id="legalCompanyName"
                name="legalCompanyName"
                autoComplete="organization"
                required
                maxLength={160}
              />
            </div>
            <div>
              <Label htmlFor="commercialRegistryNumber">Commercial Registry Number</Label>
              <Input
                id="commercialRegistryNumber"
                name="commercialRegistryNumber"
                maxLength={80}
                placeholder="e.g. HRB 12345 Amtsgericht Mannheim"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="taxId">Tax ID</Label>
                <Input id="taxId" name="taxId" required maxLength={40} />
              </div>
              <div>
                <Label htmlFor="vatId">EU VAT ID (optional)</Label>
                <Input id="vatId" name="vatId" maxLength={40} placeholder="DE123456789" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-base font-semibold text-navy">
            Authorized Management Contact
          </h2>
          <div className="mt-3 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="managingDirectorFirstName">Managing Director First Name</Label>
                <Input
                  id="managingDirectorFirstName"
                  name="managingDirectorFirstName"
                  required
                  maxLength={60}
                />
              </div>
              <div>
                <Label htmlFor="managingDirectorLastName">Managing Director Last Name</Label>
                <Input
                  id="managingDirectorLastName"
                  name="managingDirectorLastName"
                  required
                  maxLength={60}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="corporateEmail">Corporate Email Address</Label>
                <Input
                  id="corporateEmail"
                  name="corporateEmail"
                  type="email"
                  required
                  maxLength={254}
                />
              </div>
              <div>
                <Label htmlFor="companyPhone">Company Phone Number</Label>
                <Input id="companyPhone" name="companyPhone" type="tel" required maxLength={30} />
              </div>
            </div>
            <div>
              <Label htmlFor="teamSize">Initial Staff Slots</Label>
              <select
                id="teamSize"
                name="teamSize"
                defaultValue=""
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Select team size…
                </option>
                {TEAM_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-base font-semibold text-navy">Headquarters</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="headquartersPostalCode">Postal Code</Label>
              <Input
                id="headquartersPostalCode"
                name="headquartersPostalCode"
                inputMode="numeric"
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="headquartersCity">City</Label>
              <Input id="headquartersCity" name="headquartersCity" maxLength={120} />
            </div>
          </div>
        </section>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-orange text-white hover:bg-orange/90"
        >
          {submitting ? "Saving…" : "Register company & enter dashboard"}
        </Button>
      </form>
    </FormShell>
  );
}

export default BusinessForm;
