import type { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Compass,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  MessageCircle,
  Settings,
  Shield,
} from "lucide-react";
import type { Section } from "./menu-types";

type NavigateFn = ReturnType<typeof useNavigate>;

/**
 * Homeowner-only menu sections: Overview/Notifications, Projects
 * (find a tradesperson, quotes, messages), Settings, Help.
 */
export function getHomeownerSections(navigate: NavigateFn, soon: (label: string) => void): Section[] {
  return [
    {
      heading: "Dashboard",
      collapsible: true,
      defaultOpen: false,
      items: [
        { key: "overview", label: "Overview", icon: LayoutDashboard, route: "home" },
        { key: "notifications", label: "Notifications", icon: Bell, route: "notifications" },
      ],
    },
    {
      heading: "Projects",
      collapsible: true,
      defaultOpen: false,
      items: [
        {
          key: "find-tradesperson",
          label: "Find a Tradesperson",
          icon: Compass,
          action: () => {
            void navigate({ to: "/homeowner/browse" });
          },
        },
        {
          key: "my-quotes",
          label: "Quotes",
          icon: FileText,
          action: () => soon("Quotes"),
          hint: "Coming soon",
        },
        {
          key: "messages",
          label: "Messages",
          icon: MessageCircle,
          route: "messages",
        },
      ],
    },
    {
      heading: "Settings",
      collapsible: true,
      defaultOpen: false,
      items: [
        { key: "security", label: "Security", icon: Shield, route: "security" },
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
