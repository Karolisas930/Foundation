/**
 * Shared types, constants and helpers used across the split
 * Handyman profile page components.
 */
import {
  Briefcase,
  Brain,
  Car,
  ClipboardList,
  FileText,
  Flame,
  Mail,
  Package,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Sparkles,
  Star,
  TrendingUp,
  User as UserIcon,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { Map as MapIcon, ShieldAlert } from "lucide-react";

export const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export const NAV_LINKS = [
  { id: "profile", label: "Profile & Portfolio", icon: UserIcon, target: "profile" },
  { id: "team", label: "Team", icon: Users, target: "panel-team" },
  { id: "km", label: "Kilometer Tax Tracker", icon: Car, target: "panel-km" },
  {
    id: "receipts",
    label: "Shared Receipts & Materials",
    icon: ReceiptIcon,
    target: "panel-receipts",
  },
  { id: "receipt-ai", label: "Smart Receipt AI", icon: Sparkles, target: "pro-receipt-ai" },
  { id: "voice-invoice", label: "Voice-to-Invoice", icon: FileText, target: "pro-voice-invoice" },
  { id: "punch-list", label: "Digital Punch List", icon: ClipboardList, target: "pro-punch-list" },

  { id: "tool-tracker", label: "Tool & Equipment Tracker", icon: Wrench, target: "pro-tools" },
  { id: "material-compare", label: "Material Comparator", icon: Package, target: "pro-materials" },
  { id: "reviews", label: "Review Requests", icon: Star, target: "pro-reviews" },
  { id: "leads", label: "Lead Quality", icon: Flame, target: "pro-leads" },
  { id: "route", label: "Route Optimizer", icon: MapIcon, target: "pro-route-optimizer" },
  { id: "helper", label: "Helper Matcher", icon: UserPlus, target: "pro-helper-matcher" },
  { id: "weather", label: "Weather & Delays", icon: TrendingUp, target: "pro-weather-delay" },
  { id: "compliance", label: "Compliance Reminders", icon: ShieldAlert, target: "pro-compliance" },
  { id: "email-connect", label: "Connect my email", icon: Mail, target: "pro-email-connect" },
  { id: "jobs", label: "Jobs", icon: Briefcase, target: "panel-jobs" },
  { id: "invoices", label: "Invoices", icon: FileText, target: "panel-invoices" },
  { id: "settings", label: "Settings", icon: SettingsIcon, target: "settings" },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];

export type ShowcaseFolder = {
  id: string;
  title: string;
  before: string | null;
  after: string | null;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Member" | "Pending";
  color: string;
};

export type Trip = {
  id: string;
  date: string;
  from: string;
  to: string;
  km: number;
  purpose: string;
  memberId: string;
};

export type ReceiptItem = {
  id: string;
  name: string;
  vendor: string;
  amount: string;
  date: string;
  dataUrl: string;
  memberId: string;
};

export type Material = {
  id: string;
  date: string;
  vendor: string;
  item: string;
  cost: number;
  memberId: string;
};

export function readFile(file: File, max = 5 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > max) {
      reject(new Error("Image too large — keep it under 5 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
