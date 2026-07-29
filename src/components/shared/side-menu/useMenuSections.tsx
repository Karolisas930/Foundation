import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  useBusinessSettingsStatus,
  type BusinessSettingsModal,
} from "@/features/contractor/settings/components/BusinessSettingsModals";
import { useDashboard } from "@/routes/_dashboard/route";
import type { Section } from "./menu-types";
import { getHomeownerSections } from "./homeowner-sections";
import { getContractorSections } from "./contractor-sections";

export type SectionHandlers = {
  setOpen: (o: boolean) => void;
  setJobRadarOpen: (o: boolean) => void;
  setKmOpen: (o: boolean) => void;
  setInvoicesOpen: (o: boolean) => void;
  setReceiptsOpen: (o: boolean) => void;
  setTaxToolsOpen: (o: boolean) => void;
  setVoiceOpen: (o: boolean) => void;
  setSiteDiaryOpen: (o: boolean) => void;
  setHelpRequestOpen: (o: boolean) => void;
  setBsModal: (m: BusinessSettingsModal) => void;
};

/**
 * Builds the AppSideMenu navigation sections. Kept as a hook so the
 * orchestrator only wires state; actual section content lives in
 * ./homeowner-sections.tsx and ./contractor-sections.tsx.
 *
 * Branches on the real account role (`useDashboard().isContractor`) -
 * homeowners get a small, homeowner-relevant menu instead of the
 * contractor toolkit.
 */
export function useMenuSections(handlers: SectionHandlers): Section[] {
  const navigate = useNavigate();
  const bsStatus = useBusinessSettingsStatus();
  const { isContractor } = useDashboard();

  function soon(label: string) {
    handlers.setOpen(false);
    toast.message(label, { description: "Coming in your next release." });
  }

  if (!isContractor) {
    return getHomeownerSections(navigate, soon);
  }

  return getContractorSections(navigate, soon, bsStatus, handlers);
}
