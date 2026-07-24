/**
 * ============================================================================
 *  PROTECTED CORE FILE — DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL
 * ----------------------------------------------------------------------------
 *  This file is part of the Chameleon / Dynamic Sector core and the project's
 *  shared theming surface. Edits here cascade across every sector, route, and
 *  visual primitive. Refactors, renames, "cleanups", or stylistic rewrites
 *  are NOT permitted unless the user has specifically requested a change to
 *  this file by name.
 *
 *  Allowed: additive, backwards-compatible fixes the user explicitly asked for.
 *  Forbidden: silent reorganization, removing exports, changing public API,
 *  swapping tokens, or "modernizing" patterns.
 * ============================================================================
 */
/**
 * Sector & role registry for the Chameleon dashboard.
 * Each sector has a lazy-loaded panel + an RBAC allow-list.
 */
import type { ComponentType, LazyExoticComponent } from "react";
import {
  Hammer,
  HardHat,
  Home,
  ShieldCheck,
  Truck,
  Trash2,
  Building2,
  Compass,
  Crown,
  Briefcase,
} from "lucide-react";

export type SectorRole =
  | "admin"
  | "b2b_master"
  | "build"
  | "business"
  | "architect"
  | "handyman"
  | "security"
  | "logistics"
  | "disposal"
  | "homeowner";

export type SectorId =
  | "build"
  | "business"
  | "architect"
  | "handyman"
  | "security"
  | "logistics"
  | "disposal"
  | "homeowner";

export interface SectorDef {
  id: SectorId;
  shortLabel: string;
  icon: typeof Home;
  allowedRoles: SectorRole[];
  load: () => Promise<{ default: ComponentType<{ sector: SectorId }> }>;
}

export const SECTORS: Record<SectorId, SectorDef> = {
  build: {
    id: "build",
    shortLabel: "Build Control",
    icon: HardHat,
    allowedRoles: ["admin", "b2b_master", "build"],
    load: () => import("@/lib/sector-panels").then((m) => ({ default: m.BuildPanel })),
  },
  business: {
    id: "business",
    shortLabel: "Business",
    icon: Briefcase,
    allowedRoles: ["admin", "b2b_master", "business"],
    load: () => import("@/lib/sector-panels").then((m) => ({ default: m.BusinessPanel })),
  },
  architect: {
    id: "architect",
    shortLabel: "Architect",
    icon: Compass,
    allowedRoles: ["admin", "b2b_master", "architect"],
    load: () => import("@/lib/sector-panels").then((m) => ({ default: m.ArchitectPanel })),
  },
  handyman: {
    id: "handyman",
    shortLabel: "Handyman",
    icon: Hammer,
    allowedRoles: ["admin", "b2b_master", "handyman"],
    load: () => import("@/lib/sector-panels").then((m) => ({ default: m.HandymanPanel })),
  },
  security: {
    id: "security",
    shortLabel: "Security",
    icon: ShieldCheck,
    allowedRoles: ["admin", "b2b_master", "security"],
    load: () => import("@/lib/sector-panels").then((m) => ({ default: m.SecurityPanel })),
  },
  logistics: {
    id: "logistics",
    shortLabel: "Logistics",
    icon: Truck,
    allowedRoles: ["admin", "b2b_master", "logistics"],
    load: () => import("@/lib/sector-panels").then((m) => ({ default: m.LogisticsPanel })),
  },
  disposal: {
    id: "disposal",
    shortLabel: "Disposal",
    icon: Trash2,
    allowedRoles: ["admin", "b2b_master", "disposal"],
    load: () => import("@/lib/sector-panels").then((m) => ({ default: m.DisposalPanel })),
  },
  homeowner: {
    id: "homeowner",
    shortLabel: "Homeowner",
    icon: Home,
    allowedRoles: ["admin", "homeowner"],
    load: () => import("@/lib/sector-panels").then((m) => ({ default: m.HomeownerPanel })),
  },
};

export const SECTOR_ORDER: SectorId[] = [
  "build",
  "business",
  "architect",
  "handyman",
  "security",
  "logistics",
  "disposal",
  "homeowner",
];

const ROLE_DEFAULT: Record<SectorRole, SectorId> = {
  admin: "build",
  b2b_master: "build",
  build: "build",
  business: "business",
  architect: "architect",
  handyman: "handyman",
  security: "security",
  logistics: "logistics",
  disposal: "disposal",
  homeowner: "homeowner",
};

export function defaultSectorForRole(role: SectorRole): SectorId {
  return ROLE_DEFAULT[role] ?? "build";
}

export function canRoleAccessSector(role: SectorRole, sector: SectorId): boolean {
  return SECTORS[sector].allowedRoles.includes(role);
}

export type LazySectorPanel = LazyExoticComponent<ComponentType<{ sector: SectorId }>>;
