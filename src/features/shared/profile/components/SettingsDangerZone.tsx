import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function SettingsDangerZone() {
  const handleDeleteAccount = () => {
    if (confirm("Delete your account? This cannot be undone.")) {
      toast.error("Account deletion request sent.");
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h4 className="font-semibold text-red-400 mb-4">Danger Zone</h4>
        <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
          Delete Account
        </Button>
      </div>

      <Button
        variant="destructive"
        className="w-full mt-4 h-12"
        onClick={() => {
          if (confirm("Sign out?")) {
            toast.success("Signed out");
            window.location.href = "/";
          }
        }}
      >
        <LogOut className="mr-2 size-5" />
        Sign Out
      </Button>
    </>
  );
}
