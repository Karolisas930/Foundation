/**
 * Effective permissions for the current viewer.
 *
 * Resolution order:
 *  1. Impersonation override in localStorage ("hw:impersonate:memberId") —
 *     lets the owner preview the workspace as any invited team member.
 *  2. Row in public.team_members where member_user_id = auth.uid() —
 *     the signed-in user is a restricted staff invitee.
 *  3. Fallback: full owner access.
 *
 * The permissions here mirror the boolean columns on public.team_members
 * added in the "team member permission columns" migration.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";

export type EffectivePermissions = {
  canSeeInvoices: boolean;
  canSeeBankDetails: boolean;
  canSeeFinancials: boolean;
  canLogTime: boolean;
  canUploadReceipts: boolean;
  canUploadPhotos: boolean;
};

export const OWNER_ALL: EffectivePermissions = {
  canSeeInvoices: true,
  canSeeBankDetails: true,
  canSeeFinancials: true,
  canLogTime: true,
  canUploadReceipts: true,
  canUploadPhotos: true,
};

const IMPERSONATE_KEY = "hw:impersonate:memberId";

type Row = {
  id: string;
  name: string | null;
  email: string;
  team_role: string;
  can_see_invoices: boolean;
  can_see_bank_details: boolean;
  can_see_financials: boolean;
  can_log_time: boolean;
  can_upload_receipts: boolean;
  can_upload_photos: boolean;
};

function rowToPerms(row: Row): EffectivePermissions {
  return {
    canSeeInvoices: !!row.can_see_invoices,
    canSeeBankDetails: !!row.can_see_bank_details,
    canSeeFinancials: !!row.can_see_financials,
    canLogTime: !!row.can_log_time,
    canUploadReceipts: !!row.can_upload_receipts,
    canUploadPhotos: !!row.can_upload_photos,
  };
}

export function setImpersonatedMember(memberId: string | null) {
  if (typeof window === "undefined") return;
  if (memberId) localStorage.setItem(IMPERSONATE_KEY, memberId);
  else localStorage.removeItem(IMPERSONATE_KEY);
  window.dispatchEvent(new CustomEvent("hw:impersonate:update"));
}

export function getImpersonatedMemberId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(IMPERSONATE_KEY);
}

export function useTeamPermissions(): {
  loading: boolean;
  isRestrictedStaff: boolean;
  impersonating: boolean;
  memberName: string | null;
  permissions: EffectivePermissions;
} {
  const { user } = useAuth();
  const [state, setState] = useState<{
    loading: boolean;
    isRestrictedStaff: boolean;
    impersonating: boolean;
    memberName: string | null;
    permissions: EffectivePermissions;
  }>({
    loading: true,
    isRestrictedStaff: false,
    impersonating: false,
    memberName: null,
    permissions: OWNER_ALL,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const impersonateId = getImpersonatedMemberId();

      // Impersonation path — read the specific row (visible to owner via RLS).
      if (impersonateId) {
        const { data, error } = await supabase
          .from("team_members")
          .select(
            "id,name,email,team_role,can_see_invoices,can_see_bank_details,can_see_financials,can_log_time,can_upload_receipts,can_upload_photos",
          )
          .eq("id", impersonateId)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data && data.team_role !== "owner") {
          setState({
            loading: false,
            isRestrictedStaff: true,
            impersonating: true,
            memberName: (data as Row).name ?? (data as Row).email,
            permissions: rowToPerms(data as Row),
          });
          return;
        }
      }

      // Real signed-in staff invitee?
      if (user?.id && !user.id.startsWith("demo:")) {
        const { data } = await supabase
          .from("team_members")
          .select(
            "id,name,email,team_role,can_see_invoices,can_see_bank_details,can_see_financials,can_log_time,can_upload_receipts,can_upload_photos",
          )
          .eq("member_user_id", user.id)
          .neq("team_role", "owner")
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          setState({
            loading: false,
            isRestrictedStaff: true,
            impersonating: false,
            memberName: (data as Row).name ?? (data as Row).email,
            permissions: rowToPerms(data as Row),
          });
          return;
        }
      }

      if (cancelled) return;
      setState({
        loading: false,
        isRestrictedStaff: false,
        impersonating: false,
        memberName: null,
        permissions: OWNER_ALL,
      });
    }

    void resolve();
    const handler = () => void resolve();
    window.addEventListener("hw:impersonate:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("hw:impersonate:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [user?.id]);

  return state;
}
