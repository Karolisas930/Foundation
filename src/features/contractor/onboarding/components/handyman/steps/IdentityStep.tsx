/**
 * IdentityStep — Step 1 of the Handyman onboarding wizard.
 * Collects first name, last name and (optional) company name.
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CARD_CLS,
  HEADER_CLS,
} from "@/features/contractor/onboarding/components/onboarding-constants";

interface Props {
  firstName: string;
  lastName: string;
  businessName: string;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onTouch: (k: string) => void;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setBusinessName: (v: string) => void;
}

export function IdentityStep({
  firstName,
  lastName,
  businessName,
  errors,
  touched,
  onTouch,
  setFirstName,
  setLastName,
  setBusinessName,
}: Props) {
  return (
    <section id="identity" className={CARD_CLS}>
      <h2 className={HEADER_CLS}>Identity</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName" className="text-white">
            First name <span className="text-orange">*</span>
          </Label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
            minLength={2}
            maxLength={60}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => onTouch("firstName")}
            className={cn(
              "intake-input mt-2",
              touched.firstName && errors.firstName && "border-orange/70 ring-1 ring-orange/40",
            )}
          />
          {touched.firstName && errors.firstName && (
            <p className="mt-1 text-[11px] font-medium text-orange">{errors.firstName}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName" className="text-white">
            Last name <span className="text-orange">*</span>
          </Label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            minLength={2}
            maxLength={60}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => onTouch("lastName")}
            className={cn(
              "intake-input mt-2",
              touched.lastName && errors.lastName && "border-orange/70 ring-1 ring-orange/40",
            )}
          />
          {touched.lastName && errors.lastName && (
            <p className="mt-1 text-[11px] font-medium text-orange">{errors.lastName}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="businessName" className="text-white">
          Business / company name
        </Label>
        <Input
          id="businessName"
          maxLength={120}
          placeholder="e.g. Müller Bau GmbH"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="intake-input mt-2"
        />
      </div>
    </section>
  );
}
