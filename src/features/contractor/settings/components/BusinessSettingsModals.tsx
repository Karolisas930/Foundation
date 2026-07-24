/**
 * BusinessSettingsModals — thin dispatcher wrapping the individual modal
 * components that live under ./business-settings/. Re-exports the public
 * surface (StatusBadge, useBusinessSettingsStatus, BusinessSettingsModal
 * type) so existing imports keep working.
 */
import { ConnectEmailModal } from "../business-settings/ConnectEmailModal";
import { PayoutModal } from "../business-settings/PayoutModal";
import { UploadModal } from "../business-settings/UploadModal";
import { KEYS, type BusinessSettingsModal } from "../business-settings/types";

export { StatusBadge } from "../business-settings/StatusBadge";
export { useBusinessSettingsStatus } from "../business-settings/types";
export type { BusinessSettingsModal } from "../business-settings/types";

export function BusinessSettingsModals({
  modal,
  onChange,
}: {
  modal: BusinessSettingsModal;
  onChange: (m: BusinessSettingsModal) => void;
}) {
  const close = () => onChange(null);
  return (
    <>
      <ConnectEmailModal
        open={modal === "email"}
        onOpenChange={(o) => (o ? onChange("email") : close())}
      />
      <PayoutModal
        open={modal === "payout"}
        onOpenChange={(o) => (o ? onChange("payout") : close())}
      />
      <UploadModal
        open={modal === "meister"}
        onOpenChange={(o) => (o ? onChange("meister") : close())}
        storageKey={KEYS.meister}
        title="Master Craftsman & Chamber Verification"
        subtitle="Meisterbrief or HWK certificate"
        helper="PDF or photo · max 10 MB"
        accept="application/pdf,image/*"
      />
      <UploadModal
        open={modal === "insurance"}
        onOpenChange={(o) => (o ? onChange("insurance") : close())}
        storageKey={KEYS.insurance}
        title="Business Liability Insurance Proof"
        subtitle="Betriebshaftpflicht policy document"
        helper="PDF or photo · max 10 MB"
        accept="application/pdf,image/*"
      />
      <UploadModal
        open={modal === "handwerkskarte"}
        onOpenChange={(o) => (o ? onChange("handwerkskarte") : close())}
        storageKey={KEYS.handwerkskarte}
        title="Handwerkskarte & Gewerbeanmeldung"
        subtitle="Trade card and business registration"
        helper="PDF or photo · max 10 MB"
        accept="application/pdf,image/*"
      />
      <UploadModal
        open={modal === "freistellung"}
        onOpenChange={(o) => (o ? onChange("freistellung") : close())}
        storageKey={KEYS.freistellung}
        title="Freistellungsbescheinigung (§ 48b EStG)"
        subtitle="Tax withholding exemption certificate"
        helper="PDF · valid certificate from your Finanzamt"
        accept="application/pdf,image/*"
      />
    </>
  );
}

export default BusinessSettingsModals;
