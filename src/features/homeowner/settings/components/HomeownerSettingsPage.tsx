/**
 * Homeowner-facing "Settings & Privacy" page.
 *
 * Before this existed, /settings rendered the contractor ProfileAppPage for
 * everyone, so a homeowner tapping "Preferences" in the side menu landed on
 * a tradesperson profile page (company logo upload, Meister verification,
 * service radius). Homeowners now get their own page and never cross into
 * contractor surfaces.
 */
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Building2,
  Compass,
  FileText,
  KeyRound,
  LogOut,
  Mail,
  MessageCircle,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

function Card({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-orange-300 ring-1 ring-inset ring-white/10">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/5 py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/50">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function HomeownerSettingsPage() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [quoteAlerts, setQuoteAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  const displayName =
    profile?.display_name ||
    (user?.user_metadata?.full_name as string) ||
    user?.email ||
    "Your account";

  async function handleResetPassword() {
    if (!user?.email) {
      toast.error("No email address on this account.");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password reset link sent — check your inbox.");
    } catch {
      toast.error("Couldn't send the reset link. Try again in a moment.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      /* non-fatal */
    }
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-[#0f172a] pb-28 text-slate-50">
      <TopBar showMenu />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">
          Homeowner
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white">
          Settings &amp; Privacy
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Manage your account, notifications and where your projects go.
        </p>

        <div className="mt-8 space-y-4">
          <Card icon={User} title={displayName} description={user?.email ?? undefined}>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void navigate({ to: "/security" })}
              >
                <Shield className="h-4 w-4" strokeWidth={1.75} />
                Security
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={handleResetPassword}
              >
                <KeyRound className="h-4 w-4" strokeWidth={1.75} />
                Reset password
              </Button>
            </div>
          </Card>

          <Card
            icon={Bell}
            title="Notifications"
            description="Choose what we tell you about, and how."
          >
            <ToggleRow
              label="Email updates"
              hint="Project status and account emails."
              checked={emailUpdates}
              onCheckedChange={setEmailUpdates}
            />
            <ToggleRow
              label="New quote alerts"
              hint="When a tradesperson bids on your project."
              checked={quoteAlerts}
              onCheckedChange={setQuoteAlerts}
            />
            <ToggleRow
              label="Message alerts"
              hint="New chat messages from tradespeople."
              checked={messageAlerts}
              onCheckedChange={setMessageAlerts}
            />
          </Card>

          <Card icon={FileText} title="Your projects" description="Everything you've posted.">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void navigate({ to: "/homeowner" })}
              >
                <FileText className="h-4 w-4" strokeWidth={1.75} />
                Project dashboard
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void navigate({ to: "/homeowner/properties" })}
              >
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
                My properties
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void navigate({ to: "/homeowner/browse" })}
              >
                <Compass className="h-4 w-4" strokeWidth={1.75} />
                Find a tradesperson
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void navigate({ to: "/messages" })}
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                Messages
              </Button>
            </div>
          </Card>

          <Card icon={Mail} title="Legal">
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <a href="/impressum" className="hover:text-white hover:underline">
                Impressum
              </a>
              <a href="/datenschutz" className="hover:text-white hover:underline">
                Datenschutz
              </a>
              <a href="/terms-of-service" className="hover:text-white hover:underline">
                Terms
              </a>
            </div>
          </Card>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full gap-2 border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-red-100"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Log out
          </Button>
        </div>
      </main>
      <BottomBar />
    </div>
  );
}

export default HomeownerSettingsPage;
