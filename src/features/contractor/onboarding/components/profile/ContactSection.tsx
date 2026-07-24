/**
 * ContactSection — email, phone, website. Local-only fields rendered for
 * visual completeness; persistence lives on HandymanProfilePage's save.
 */
import { Mail, Phone, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionShell } from "./SectionShell";

interface Props {
  editing: boolean;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  onDirty: () => void;
}

export function ContactSection({
  editing,
  email,
  setEmail,
  phone,
  setPhone,
  website,
  setWebsite,
  onDirty,
}: Props) {
  return (
    <SectionShell
      id="section-contact"
      icon={Mail}
      eyebrow="Step 4"
      title="Contact & Business Info"
      subtitle="How clients reach you. Shown on accepted quotes only."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label
            htmlFor="pfEmail"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            <Mail className="mr-1 inline size-3" /> Business email
          </Label>
          <Input
            id="pfEmail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onDirty();
            }}
            readOnly={!editing}
            placeholder="hello@yourbusiness.de"
            className="intake-input mt-2 read-only:cursor-not-allowed read-only:opacity-80"
          />
        </div>
        <div>
          <Label
            htmlFor="pfPhone"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            <Phone className="mr-1 inline size-3" /> Mobile phone
          </Label>
          <Input
            id="pfPhone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              onDirty();
            }}
            readOnly={!editing}
            placeholder="+49 …"
            className="intake-input mt-2 read-only:cursor-not-allowed read-only:opacity-80"
          />
        </div>
      </div>
      <div>
        <Label
          htmlFor="pfWeb"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          <Globe className="mr-1 inline size-3" /> Website (optional)
        </Label>
        <Input
          id="pfWeb"
          type="url"
          value={website}
          onChange={(e) => {
            setWebsite(e.target.value);
            onDirty();
          }}
          readOnly={!editing}
          placeholder="https://"
          className="intake-input mt-2 read-only:cursor-not-allowed read-only:opacity-80"
        />
      </div>
    </SectionShell>
  );
}
