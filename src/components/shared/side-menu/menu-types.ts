import type { useTeamPermissions } from "@/features/contractor/team/hooks/useTeamPermissions";
import type { User } from "lucide-react";

export type RouteTarget =
  | "home"
  | "profile"
  | "performance"
  | "finanz"
  | "reports"
  | "settings"
  | "notifications"
  | "messages"
  | "security"
  | "team"
  | "team-locations"
  | "staff-hours"
  | "calendar";

export type DrawerItem = {
  key: string;
  label: string;
  icon: typeof User;
  sub?: boolean;
  badge?: React.ReactNode;
  hint?: string;
} & ({ route: RouteTarget } | { action: () => void });

export type Section = {
  heading?: string;
  items: DrawerItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function getInitials(email: string, name?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email || "U").slice(0, 2).toUpperCase();
}

/**
 * Global nav gate for staff invitees. Hides finance / performance / payout
 * entries when the viewer is restricted staff (real or impersonated).
 */
export const RESTRICTED_HIDE_KEYS = new Set([
  "performance",
  "payout-banking",
  "km",
  "quickfin",
  "subs",
  "review",
  "lead",
  "business-legal",
  "subscription-billing",
  "security",
  "notifications",
  "calendar",
  "team-staff",
]);

export function filterSectionsForRole(
  sections: Section[],
  perms: ReturnType<typeof useTeamPermissions>,
): Section[] {
  if (!perms.isRestrictedStaff) return sections;
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((it) => !RESTRICTED_HIDE_KEYS.has(it.key)),
    }))
    .filter((s) => s.items.length > 0);
}
