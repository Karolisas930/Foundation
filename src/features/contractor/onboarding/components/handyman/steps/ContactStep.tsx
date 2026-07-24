/**
 * ContactStep — Step 4. Business email + mobile phone.
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CARD_CLS,
  HEADER_CLS,
} from "@/features/contractor/onboarding/components/onboarding-constants";

interface Props {
  businessEmail: string;
  mobilePhone: string;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onTouch: (k: string) => void;
  setBusinessEmail: (v: string) => void;
  setMobilePhone: (v: string) => void;
}

export function ContactStep({
  businessEmail,
  mobilePhone,
  errors,
  touched,
  onTouch,
  setBusinessEmail,
  setMobilePhone,
}: Props) {
  return (
    <section id="contact" className={CARD_CLS}>
      <h2 className={HEADER_CLS}>Contact</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="businessEmail" className="text-white">
            Business email <span className="text-orange">*</span>
          </Label>
          <Input
            id="businessEmail"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            onBlur={() => onTouch("businessEmail")}
            className={cn(
              "intake-input mt-2",
              touched.businessEmail &&
                errors.businessEmail &&
                "border-orange/70 ring-1 ring-orange/40",
            )}
          />
          {touched.businessEmail && errors.businessEmail && (
            <p className="mt-1 text-[11px] font-medium text-orange">{errors.businessEmail}</p>
          )}
        </div>
        <div>
          <Label htmlFor="mobilePhone" className="text-white">
            Mobile phone <span className="text-orange">*</span>
          </Label>
          <Input
            id="mobilePhone"
            type="tel"
            required
            maxLength={30}
            placeholder="017X XXX XXXX"
            value={mobilePhone}
            onChange={(e) => setMobilePhone(e.target.value)}
            onBlur={() => onTouch("mobilePhone")}
            className={cn(
              "intake-input mt-2",
              touched.mobilePhone && errors.mobilePhone && "border-orange/70 ring-1 ring-orange/40",
            )}
          />
          {touched.mobilePhone && errors.mobilePhone && (
            <p className="mt-1 text-[11px] font-medium text-orange">{errors.mobilePhone}</p>
          )}
        </div>
      </div>
    </section>
  );
}
