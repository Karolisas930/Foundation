/**
 * Team & Staff store.
 *
 * The team roster now persists to the Supabase `team_members` table
 * (owner-scoped by RLS) via `inviteMemberRemote` / `seedRestrictedStaff`.
 * Staff activity (time logs, receipts, before/after photos) still lives
 * in localStorage; those artefacts get their own tables later.
 */

import { supabase } from "@/integrations/supabase/client";

export type TeamRole = "Owner" | "Staff";

/** Extended job title / craft role used for display and filtering. */
export type ExtendedRole =
  | "Owner"
  | "Master Craftsman"
  | "Journeyman"
  | "Apprentice"
  | "Office"
  | "Subcontractor"
  | "Other";

export const EXTENDED_ROLES: { value: ExtendedRole; label: string; hint: string }[] = [
  { value: "Owner", label: "Owner", hint: "Business owner — full access to everything." },
  {
    value: "Master Craftsman",
    label: "Master Tradesperson",
    hint: "Experienced lead tradesperson who oversees jobs and signs off work.",
  },
  {
    value: "Journeyman",
    label: "Skilled Tradesperson (Journeyman)",
    hint: "Qualified crew member working independently on site.",
  },
  {
    value: "Apprentice",
    label: "Apprentice",
    hint: "Trainee learning the trade — logs hours and assists on site.",
  },
  {
    value: "Office",
    label: "Office Staff",
    hint: "Handles admin, scheduling, quotes and paperwork.",
  },
  {
    value: "Subcontractor",
    label: "Subcontractor",
    hint: "External contractor with access scoped to assigned jobs.",
  },
  { value: "Other", label: "Other", hint: "Any role that doesn't fit the categories above." },
];

export type PermissionLevel = "full" | "financial" | "limited" | "view";

export const PERMISSION_LEVELS: {
  value: PermissionLevel;
  label: string;
  description: string;
  can: string[];
  cannot: string[];
}[] = [
  {
    value: "full",
    label: "Full Access",
    description:
      "Complete access to the entire app. Recommended for trusted team members and managers.",
    can: [
      "View and manage all areas of the app",
      "Manage staff, jobs, finances and documents",
      "Log hours, upload receipts and job photos",
    ],
    cannot: [],
  },
  {
    value: "financial",
    label: "Financial Access",
    description:
      "Can manage invoices, receipts, bank details, and KM tracker. Cannot manage staff or jobs.",
    can: [
      "Manage invoices and receipts",
      "View bank details and use the KM tracker",
      "Log hours, upload receipts and job photos",
    ],
    cannot: ["Manage staff or jobs"],
  },
  {
    value: "limited",
    label: "Limited Access",
    description:
      "Can log working hours and upload photos/receipts on site. Cannot see financial data.",
    can: ["Log working hours", "Upload job site photos", "Upload receipts and expenses"],
    cannot: ["View financial data, invoices or bank details"],
  },
  {
    value: "view",
    label: "View Only",
    description: "Read-only access. Cannot make any changes.",
    can: ["View the team roster and job list"],
    cannot: ["Make any changes", "View invoices, bank details or financial data"],
  },
];

export type StaffPermissions = {
  canSeeInvoices: boolean;
  canSeeBankDetails: boolean;
  canSeeFinancials: boolean;
  canLogTime: boolean;
  canUploadReceipts: boolean;
  canUploadPhotos: boolean;
};

export const OWNER_PERMISSIONS: StaffPermissions = {
  canSeeInvoices: true,
  canSeeBankDetails: true,
  canSeeFinancials: true,
  canLogTime: true,
  canUploadReceipts: true,
  canUploadPhotos: true,
};

export const STAFF_DEFAULT_PERMISSIONS: StaffPermissions = {
  canSeeInvoices: false,
  canSeeBankDetails: false,
  canSeeFinancials: false,
  canLogTime: true,
  canUploadReceipts: true,
  canUploadPhotos: true,
};

export const PERMISSION_PRESETS: Record<PermissionLevel, StaffPermissions> = {
  full: OWNER_PERMISSIONS,
  financial: {
    canSeeInvoices: true,
    canSeeBankDetails: true,
    canSeeFinancials: true,
    canLogTime: true,
    canUploadReceipts: true,
    canUploadPhotos: true,
  },
  limited: STAFF_DEFAULT_PERMISSIONS,
  view: {
    canSeeInvoices: false,
    canSeeBankDetails: false,
    canSeeFinancials: false,
    canLogTime: false,
    canUploadReceipts: false,
    canUploadPhotos: false,
  },
};

export function detectPermissionLevel(p: StaffPermissions): PermissionLevel | "custom" {
  for (const key of Object.keys(PERMISSION_PRESETS) as PermissionLevel[]) {
    const preset = PERMISSION_PRESETS[key];
    const same = (Object.keys(preset) as (keyof StaffPermissions)[]).every(
      (k) => preset[k] === p[k],
    );
    if (same) return key;
  }
  return "custom";
}

export type TimeLog = {
  id: string;
  date: string; // yyyy-mm-dd
  hours: number;
  jobRef?: string;
  note?: string;
  createdAt: string;
};

export type ReceiptEntry = {
  id: string;
  label: string;
  amount: number;
  date: string;
  vendor?: string;
  dataUrl?: string;
  createdAt: string;
};

export type JobPhoto = {
  id: string;
  jobRef?: string;
  kind: "before" | "after";
  dataUrl: string;
  note?: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  title?: ExtendedRole;
  permissionLevel?: PermissionLevel;
  phone?: string;
  joinedAt?: string;
  status: "active" | "pending" | "inactive";
  invitedAt: string;
  permissions: StaffPermissions;
  timeLogs: TimeLog[];
  receipts: ReceiptEntry[];
  photos: JobPhoto[];
};

const KEY = "hw:team:v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function seed(): TeamMember[] {
  return [
    {
      id: "owner",
      name: "You (Owner)",
      email: "you@handwerk.local",
      role: "Owner",
      title: "Owner",
      permissionLevel: "full",
      status: "active",
      joinedAt: new Date().toISOString(),
      invitedAt: new Date().toISOString(),
      permissions: OWNER_PERMISSIONS,
      timeLogs: [],
      receipts: [],
      photos: [],
    },
  ];
}

export function loadTeam(): TeamMember[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as TeamMember[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

export function saveTeam(list: TeamMember[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("hw:team:update"));
  } catch {
    /* ignore */
  }
}

export function subscribeTeam(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => cb();
  window.addEventListener("hw:team:update", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("hw:team:update", handler);
    window.removeEventListener("storage", handler);
  };
}

export function inviteMember(input: {
  name: string;
  email: string;
  role: TeamRole;
  title?: ExtendedRole;
  permissionLevel?: PermissionLevel;
  phone?: string;
  permissions?: StaffPermissions;
}): TeamMember {
  const list = loadTeam();
  const now = new Date().toISOString();
  const member: TeamMember = {
    id: uid(),
    name: input.name.trim() || input.email.split("@")[0],
    email: input.email.trim(),
    role: input.role,
    title: input.title,
    permissionLevel: input.permissionLevel,
    phone: input.phone?.trim() || undefined,
    status: "pending",
    invitedAt: now,
    joinedAt: now,
    permissions:
      input.permissions ??
      (input.permissionLevel
        ? PERMISSION_PRESETS[input.permissionLevel]
        : STAFF_DEFAULT_PERMISSIONS),
    timeLogs: [],
    receipts: [],
    photos: [],
  };
  saveTeam([...list, member]);
  return member;
}

/* ------------------------------------------------------------------ *
 * Supabase-backed roster
 * ------------------------------------------------------------------ */

function permsToRow(p: StaffPermissions) {
  return {
    can_see_invoices: p.canSeeInvoices,
    can_see_bank_details: p.canSeeBankDetails,
    can_see_financials: p.canSeeFinancials,
    can_log_time: p.canLogTime,
    can_upload_receipts: p.canUploadReceipts,
    can_upload_photos: p.canUploadPhotos,
  };
}

export type RemoteTeamMember = {
  id: string;
  owner_id: string;
  member_user_id: string | null;
  email: string;
  name: string | null;
  team_role: string;
  status: string;
  invited_at: string;
  permissions: StaffPermissions;
};

function rowToRemote(row: {
  id: string;
  owner_id: string;
  member_user_id: string | null;
  email: string;
  name: string | null;
  team_role: string;
  status: string;
  invited_at: string;
  can_see_invoices: boolean;
  can_see_bank_details: boolean;
  can_see_financials: boolean;
  can_log_time: boolean;
  can_upload_receipts: boolean;
  can_upload_photos: boolean;
}): RemoteTeamMember {
  return {
    id: row.id,
    owner_id: row.owner_id,
    member_user_id: row.member_user_id,
    email: row.email,
    name: row.name,
    team_role: row.team_role,
    status: row.status,
    invited_at: row.invited_at,
    permissions: {
      canSeeInvoices: row.can_see_invoices,
      canSeeBankDetails: row.can_see_bank_details,
      canSeeFinancials: row.can_see_financials,
      canLogTime: row.can_log_time,
      canUploadReceipts: row.can_upload_receipts,
      canUploadPhotos: row.can_upload_photos,
    },
  };
}

/**
 * Insert or upsert an invite into public.team_members. RLS scopes rows to
 * the current owner (auth.uid()). Returns the persisted row.
 */
export async function inviteMemberRemote(input: {
  ownerId: string;
  name: string;
  email: string;
  role: TeamRole;
  permissions: StaffPermissions;
}): Promise<RemoteTeamMember> {
  const payload = {
    owner_id: input.ownerId,
    email: input.email.trim().toLowerCase(),
    name: input.name.trim() || null,
    team_role: input.role === "Owner" ? "owner" : "staff",
    status: "invited" as const,
    ...permsToRow(input.permissions),
  };
  const { data, error } = await supabase
    .from("team_members")
    .upsert(payload, { onConflict: "owner_id,email" })
    .select(
      "id,owner_id,member_user_id,email,name,team_role,status,invited_at,can_see_invoices,can_see_bank_details,can_see_financials,can_log_time,can_upload_receipts,can_upload_photos",
    )
    .single();
  if (error) throw error;
  return rowToRemote(data as Parameters<typeof rowToRemote>[0]);
}

export async function listTeamRemote(ownerId: string): Promise<RemoteTeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select(
      "id,owner_id,member_user_id,email,name,team_role,status,invited_at,can_see_invoices,can_see_bank_details,can_see_financials,can_log_time,can_upload_receipts,can_upload_photos",
    )
    .eq("owner_id", ownerId)
    .order("invited_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => rowToRemote(r as Parameters<typeof rowToRemote>[0]));
}

/**
 * Ensure a restricted-staff test account (anna.schmidt@handwerk-test.local)
 * exists for `ownerId`, with only "Log working hours" + "Upload receipts"
 * enabled. Idempotent — reuses the row on conflict.
 */
export async function seedRestrictedStaff(ownerId: string): Promise<RemoteTeamMember> {
  return inviteMemberRemote({
    ownerId,
    name: "Anna Schmidt",
    email: "anna.schmidt@handwerk-test.local",
    role: "Staff",
    permissions: {
      canSeeInvoices: false,
      canSeeBankDetails: false,
      canSeeFinancials: false,
      canLogTime: true,
      canUploadReceipts: true,
      canUploadPhotos: false,
    },
  });
}

export function updateMember(id: string, patch: Partial<TeamMember>) {
  const list = loadTeam().map((m) => (m.id === id ? { ...m, ...patch } : m));
  saveTeam(list);
}

export function removeMember(id: string) {
  if (id === "owner") return;
  saveTeam(loadTeam().filter((m) => m.id !== id));
}

export function getMember(id: string): TeamMember | undefined {
  return loadTeam().find((m) => m.id === id);
}

export function addTimeLog(id: string, log: Omit<TimeLog, "id" | "createdAt">) {
  const list = loadTeam().map((m) =>
    m.id === id
      ? {
          ...m,
          timeLogs: [...m.timeLogs, { ...log, id: uid(), createdAt: new Date().toISOString() }],
        }
      : m,
  );
  saveTeam(list);
}

export function removeTimeLog(memberId: string, logId: string) {
  const list = loadTeam().map((m) =>
    m.id === memberId ? { ...m, timeLogs: m.timeLogs.filter((l) => l.id !== logId) } : m,
  );
  saveTeam(list);
}

export function addReceipt(id: string, r: Omit<ReceiptEntry, "id" | "createdAt">) {
  const list = loadTeam().map((m) =>
    m.id === id
      ? {
          ...m,
          receipts: [...m.receipts, { ...r, id: uid(), createdAt: new Date().toISOString() }],
        }
      : m,
  );
  saveTeam(list);
}

export function removeReceipt(memberId: string, rid: string) {
  const list = loadTeam().map((m) =>
    m.id === memberId ? { ...m, receipts: m.receipts.filter((r) => r.id !== rid) } : m,
  );
  saveTeam(list);
}

export function addPhoto(id: string, p: Omit<JobPhoto, "id" | "createdAt">) {
  const list = loadTeam().map((m) =>
    m.id === id
      ? {
          ...m,
          photos: [...m.photos, { ...p, id: uid(), createdAt: new Date().toISOString() }],
        }
      : m,
  );
  saveTeam(list);
}

export function removePhoto(memberId: string, pid: string) {
  const list = loadTeam().map((m) =>
    m.id === memberId ? { ...m, photos: m.photos.filter((p) => p.id !== pid) } : m,
  );
  saveTeam(list);
}

export function readFileAsDataUrl(file: File, maxBytes = 5 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error("File too large — keep under 5 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

/** Sum of hours logged in the current calendar month. */
export function hoursThisMonth(m: TeamMember): number {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  return m.timeLogs.reduce((s, l) => {
    const d = new Date(l.date);
    return d.getFullYear() === y && d.getMonth() === mo ? s + (Number(l.hours) || 0) : s;
  }, 0);
}

export function setMemberStatus(id: string, status: TeamMember["status"]) {
  if (id === "owner") return;
  const list = loadTeam().map((m) => (m.id === id ? { ...m, status } : m));
  saveTeam(list);
}
