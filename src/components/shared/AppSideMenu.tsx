/**
 * AppSideMenu — Twitter/X-style full-height side drawer triggered from the
 * top bar. Thin orchestrator: profile header, nav, footer and quick sheets
 * live under ./side-menu/, and the BusinessSettings modal stack ships as
 * its own component.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BusinessSettingsModals,
  type BusinessSettingsModal,
} from "@/features/contractor/settings/components/BusinessSettingsModals";
import { KmTrackerSheet } from "@/features/contractor/tools/components/KmTrackerSheet";
import {
  SmartReceiptsSheet,
  VoiceToInvoiceSheet,
} from "@/features/contractor/profile/components/toolbelt/ToolbeltModals";
import { SiteDiarySheet } from "@/features/contractor/team/components/SiteDiarySheet";
import { InvoiceHistorySheet } from "@/features/contractor/profile/components/toolbelt/InvoiceHistorySheet";
import { TaxToolsSheet } from "@/features/contractor/profile/components/toolbelt/TaxToolsSheet";
import { PostHelpRequestSheet } from "@/features/contractor/onboarding/components/PostHelpRequestSheet";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTeamPermissions } from "@/features/contractor/team/hooks/useTeamPermissions";

import { filterSectionsForRole, type RouteTarget } from "./side-menu/menu-types";
import { useMenuSections } from "./side-menu/useMenuSections";
import { SideMenuProfileHeader, SideMenuStatusToggle } from "./side-menu/SideMenuProfileHeader";
import { SideMenuNav } from "./side-menu/SideMenuNav";
import { SideMenuFooter } from "./side-menu/SideMenuFooter";
import { JobRadarSheet, QuickFinanceSheet } from "./side-menu/QuickSheets";

export function AppSideMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const teamPerms = useTeamPermissions();

  const [financeOpen, setFinanceOpen] = useState(false);
  const [kmOpen, setKmOpen] = useState(false);
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [taxToolsOpen, setTaxToolsOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [siteDiaryOpen, setSiteDiaryOpen] = useState(false);
  const [jobRadarOpen, setJobRadarOpen] = useState(false);
  const [helpRequestOpen, setHelpRequestOpen] = useState(false);
  const [bsModal, setBsModal] = useState<BusinessSettingsModal>(null);

  // Match eligibility toggle — persists across sessions.
  const [activeStatus, setActiveStatus] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("hw:match:active") !== "0";
  });
  function toggleActiveStatus(next: boolean) {
    setActiveStatus(next);
    try {
      localStorage.setItem("hw:match:active", next ? "1" : "0");
    } catch {
      /* ignore */
    }
    toast.message(next ? "Status: Aktiv" : "Status: Verbucht", {
      description: next
        ? "You'll appear in new match rotations."
        : "Hidden from new matches — active jobs unaffected.",
    });
  }

  const signedIn = isAuthenticated && Boolean(user);
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    "Account";
  const displayEmail = user?.email ?? "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? undefined;

  async function handleSignOut() {
    setOpen(false);
    try {
      await signOut();
    } catch (e) {
      console.warn("[AppSideMenu] signOut failed:", e);
    }
    void navigate({ to: "/", replace: true });
  }

  function go(target: RouteTarget) {
    setOpen(false);
    switch (target) {
      case "home":
        void navigate({ to: "/" });
        break;
      case "profile":
        void navigate({ to: "/contractor/profile" });
        break;
      case "performance":
        void navigate({ to: "/contractor/performance" });
        break;
      case "finanz":
        void navigate({ to: "/finanz" });
        break;
      case "reports":
        void navigate({ to: "/contractor/reports" });
        break;
      case "settings":
        void navigate({ to: "/settings" });
        break;
      case "notifications":
        void navigate({ to: "/notifications" });
        break;
      case "messages":
        void navigate({ to: "/messages" });
        break;
      case "security":
        void navigate({ to: "/security" });
        break;
      case "team":
        void navigate({ to: "/contractor/team" });
        break;
      case "team-locations":
        void navigate({ to: "/contractor/team/locations" });
        break;
      case "staff-hours":
        void navigate({ to: "/contractor/staff-hours" });
        break;
      case "calendar":
        void navigate({ to: "/contractor/calendar" });
        break;
    }
  }

  const sections = useMenuSections({
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
  });

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open main menu"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 active:scale-95"
          >
            <Menu className="h-7 w-7" strokeWidth={1.5} />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex h-full w-[88%] max-w-sm flex-col gap-0 border-r border-white/10 bg-[#0f172a] p-0 text-slate-50"
        >
          <SheetTitle className="sr-only">Main menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate to profile, tools, quick actions, business settings, and log out.
          </SheetDescription>

          <SideMenuProfileHeader
            displayName={displayName}
            displayEmail={displayEmail}
            avatarUrl={avatarUrl}
            onEditSettings={() => go("settings")}
            onClose={() => setOpen(false)}
          />

          <div className="h-px bg-white/10" />

          <SideMenuStatusToggle active={activeStatus} onChange={toggleActiveStatus} />

          <div className="h-px bg-white/10" />

          <nav className="flex flex-1 flex-col overflow-y-auto py-2">
            <SideMenuNav sections={filterSectionsForRole(sections, teamPerms)} onRoute={go} />
            <SideMenuFooter
              signedIn={signedIn}
              onSignOut={handleSignOut}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </SheetContent>
      </Sheet>

      <BusinessSettingsModals modal={bsModal} onChange={setBsModal} />
      <KmTrackerSheet open={kmOpen} onOpenChange={setKmOpen} />
      <SmartReceiptsSheet open={receiptsOpen} onOpenChange={setReceiptsOpen} />
      <InvoiceHistorySheet open={invoicesOpen} onOpenChange={setInvoicesOpen} />
      <TaxToolsSheet open={taxToolsOpen} onOpenChange={setTaxToolsOpen} />
      <VoiceToInvoiceSheet open={voiceOpen} onOpenChange={setVoiceOpen} />
      <SiteDiarySheet open={siteDiaryOpen} onOpenChange={setSiteDiaryOpen} />
      <PostHelpRequestSheet open={helpRequestOpen} onOpenChange={setHelpRequestOpen} />
      <JobRadarSheet open={jobRadarOpen} onOpenChange={setJobRadarOpen} />
      <QuickFinanceSheet open={financeOpen} onOpenChange={setFinanceOpen} />
    </>
  );
}

export default AppSideMenu;
