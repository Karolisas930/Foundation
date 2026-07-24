/**
 * IdentitySection — first name, last name, business name.
 */
import { UserCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionShell } from "./SectionShell";

interface Props {
  editing: boolean;
  firstName: string;
  lastName: string;
  businessName: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setBusinessName: (v: string) => void;
  onDirty: () => void;
}

export function IdentitySection({
  editing,
  firstName,
  lastName,
  businessName,
  setFirstName,
  setLastName,
  setBusinessName,
  onDirty,
}: Props) {
  return (
    <SectionShell
      id="section-identity"
      icon={UserCircle2}
      eyebrow="Step 1"
      title="Identity"
      subtitle="How clients will recognise you on quotes, invoices and the public listing."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label
            htmlFor="pfFirst"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            First name
          </Label>
          <Input
            id="pfFirst"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              onDirty();
            }}
            readOnly={!editing}
            className="intake-input mt-2 read-only:cursor-not-allowed read-only:opacity-80"
          />
        </div>
        <div>
          <Label
            htmlFor="pfLast"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Last name
          </Label>
          <Input
            id="pfLast"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              onDirty();
            }}
            readOnly={!editing}
            className="intake-input mt-2 read-only:cursor-not-allowed read-only:opacity-80"
          />
        </div>
      </div>
      <div>
        <Label
          htmlFor="pfBiz"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Business name
        </Label>
        <Input
          id="pfBiz"
          value={businessName}
          onChange={(e) => {
            setBusinessName(e.target.value);
            onDirty();
          }}
          readOnly={!editing}
          placeholder="e.g. Weber Bau GmbH"
          className="intake-input mt-2 read-only:cursor-not-allowed read-only:opacity-80"
        />
      </div>
    </SectionShell>
  );
}
