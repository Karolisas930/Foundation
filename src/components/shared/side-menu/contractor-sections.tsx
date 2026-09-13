import type { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  FileText,
  FolderOpen,
  Gauge,
  Handshake,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Mic,
  PieChart,
  Radar,
  Receipt,
  Scale,
  Settings,
  Shield,
  UsersRound,
  Wrench,
} from "lucide-react";
import {
  StatusBadge,
  type BusinessSettingsModal,
} from "@/features/contractor/settings/components/BusinessSettingsModals";
import { TRADE_SPECIALTIES, TRADE_SPECIALTY_IDS } from "@/api/db/schema";
import type { Section } from "./menu-types";
import type { SectionHandlers } from "./useMenuSections";

type NavigateFn = ReturnType<typeof useNavigate>;

type BsStatus = {
  payout: boolean;
  handwerkskarte: { status: "verified" | "pending" | "rejected" } | null;
};

/**
 * Contractor-side menu sections: Dashboard, Jobs, Trade Tools, Finance,
 * Business, Insights, Settings, Help.
 */
export function getContractorSections(
  navigate: NavigateFn,
  soon: (label: string) => void,
  bsStatus: BsStatus,
  handlers: SectionHandlers,
): Section[] {
  const {
    setOpen,
    setJobRadarOpen,
    setKmOpen,
    setInvoicesOpen,
    setReceiptsOpen,
    setTaxToolsOpen,
    setVoiceOpen,
    setSiteDiaryOpen,
    setHelpRequestOpen,
    setBsModal,
  } = handlers;

  return [
    {
      heading: "Dashboard",
      collapsible: true,
      defaultOpen: false,
      items: [
        { key: "overview", label: "Overview", icon: LayoutDashboard, route: "home" },
        {
          key: "radar",
          label: "Job Radar",
          icon: Radar,
          action: () => {
            setOpen(false);
            setJobRadarOpen(true);
          },
        },
        { key: "calendar", label: "Calendar", icon: CalendarIcon, route: "calendar" },
        { key: "notifications", label: "Notifications", icon: Bell, route: "notifications" },
      ],
    },
    {
      heading: "Jobs",
      collapsible: true,
      defaultOpen: false,
      items: [
        {
          key: "post-help",
          label: "Post Help Request",
          icon: Handshake,
          action: () => {
            setOpen(false);
            setHelpRequestOpen(true);
          },
          hint: "Ask nearby trades",
        },
        {
          key: "active-jobs",
          label: "Active Jobs",
          icon: Briefcase,
          action: () => {
            setOpen(false);
            void navigate({ to: "/contractor/jobs/active" });
          },
        },
        {
          key: "quotes",
          label: "Quotes",
          icon: FileText,
          action: () => {
            setOpen(false);
            void navigate({ to: "/contractor/jobs/quotes" });
          },
        },
        {
          key: "voice",
          label: "Voice to Invoice",
          icon: Mic,
          action: () => {
            setOpen(false);
            setVoiceOpen(true);
          },
        },
        {
          key: "site-diary",
          label: "Site Diary",
          icon: BookOpen,
          action: () => {
            setOpen(false);
            setSiteDiaryOpen(true);
          },
          hint: "Photos · Voice · Receipts",
        },
        {
          key: "subs",
          label: "Subcontractor Matcher",
          icon: Handshake,
          action: () => soon("Subcontractor & Helper Matcher"),
          hint: "Coming soon",
        },
      ],
    },
    {
      heading: "Trade Tools",
      collapsible: true,
      defaultOpen: false,
      items: TRADE_SPECIALTY_IDS.map((id) => {
        const def = TRADE_SPECIALTIES[id];
        return {
          key: `trade-${def.slug}`,
          label: def.label,
          icon: Wrench,
          action: () => {
            setOpen(false);
            void navigate({
              to: "/contractor/profile",
              search: { specialty: def.slug },
            });
          },
        };
      }),
    },
    {
      heading: "Finance",
      collapsible: true,
      defaultOpen: false,
      items: [
        {
          key: "km",
          label: "KM Tracker",
          icon: Gauge,
          action: () => {
            setOpen(false);
            setKmOpen(true);
          },
        },
        {
          key: "invoices",
          label: "Invoices",
          icon: FileText,
          action: () => {
            setOpen(false);
            setInvoicesOpen(true);
          },
        },
        {
          key: "receipts",
          label: "Receipts",
          icon: Receipt,
          action: () => {
            setOpen(false);
            setReceiptsOpen(true);
          },
        },
        {
          key: "tax-tools",
          label: "Tax Tools",
          icon: Scale,
          action: () => {
            setOpen(false);
            setTaxToolsOpen(true);
          },
        },
        {
          key: "bank-details",
          label: "Bank Details",
          icon: Landmark,
          action: () => {
            setOpen(false);
            setBsModal("payout");
          },
          badge: bsStatus.payout ? <StatusBadge status="verified" /> : undefined,
        },
      ],
    },
    {
      heading: "Business",
      collapsible: true,
      defaultOpen: false,
      items: [
        { key: "team-staff", label: "Team & Staff", icon: UsersRound, route: "team" },
        { key: "staff-hours", label: "Staff Hours", icon: Clock, route: "staff-hours" },
        {
          key: "staff-locations",
          label: "Staff Locations",
          icon: MapPin,
          route: "team-locations",
          hint: "Consent-based",
        },
        {
          key: "customers",
          label: "Customers (CRM)",
          icon: UsersRound,
          action: () => soon("Customers (CRM)"),
          hint: "Coming soon",
        },
        {
          key: "documents",
          label: "Documents",
          icon: FolderOpen,
          action: () => soon("Documents"),
          hint: "Coming soon",
        },
        {
          key: "equipment",
          label: "Equipment Register",
          icon: Wrench,
          action: () => soon("Equipment Register"),
          hint: "Coming soon",
        },
        {
          key: "business-legal",
          label: "Business & Legal",
          icon: Building2,
          action: () => {
            setOpen(false);
            setBsModal("handwerkskarte");
          },
          badge: (
            <StatusBadge
              status={bsStatus.handwerkskarte ? bsStatus.handwerkskarte.status : "missing"}
            />
          ),
        },
      ],
    },
    {
      heading: "Insights",
      collapsible: true,
      defaultOpen: false,
      items: [
        { key: "performance", label: "Performance", icon: BarChart3, route: "performance" },
        { key: "reports", label: "Downloads & Reports", icon: PieChart, route: "reports" },
      ],
    },
    {
      heading: "Settings",
      collapsible: true,
      defaultOpen: false,
      items: [
        { key: "security", label: "Security", icon: Shield, route: "security" },
        {
          key: "subscription-billing",
          label: "Subscription",
          icon: CreditCard,
          action: () => soon("Subscription & Billing"),
        },
        { key: "preferences", label: "Preferences", icon: Settings, route: "settings" },
      ],
    },
    {
      heading: "Help",
      collapsible: true,
      defaultOpen: false,
      items: [
        {
          key: "help-faq",
          label: "FAQ",
          icon: HelpCircle,
          action: () => soon("Help Center / FAQ"),
          hint: "Coming soon",
        },
        {
          key: "contact-support",
          label: "Support",
          icon: LifeBuoy,
          action: () => soon("Contact Support"),
          hint: "Coming soon",
        },
        {
          key: "community-guides",
          label: "Community",
          icon: BookOpen,
          action: () => soon("Community & Guides"),
          hint: "Coming soon",
        },
        {
          key: "report-problem",
          label: "Report Problem",
          icon: AlertTriangle,
          action: () => soon("Report a Problem"),
          hint: "Coming soon",
        },
      ],
    },
  ];
}
