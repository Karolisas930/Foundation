import { useState } from "react";
import { Key, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VoiceDictateButton } from "@/features/contractor/onboarding/components/VoiceDictateButton";

export function SettingsAccountSecurity() {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [publicBio, setPublicBio] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] blueprint-grid mix-blend-screen"
          aria-hidden
        />
        <div className="relative space-y-4">
          <h4 className="font-semibold text-white">Your Account</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="group flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-white transition hover:border-orange/40 hover:bg-white/[0.06] sm:text-sm"
            >
              <User className="size-4 shrink-0 text-orange" />
              <span className="truncate">Edit Public Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setResetPwOpen(true)}
              className="group flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-white transition hover:border-orange/40 hover:bg-white/[0.06] sm:text-sm"
            >
              <Key className="size-4 shrink-0 text-orange" />
              <span className="truncate">Reset Password</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-md border-white/10 bg-navy-deep text-white sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-white">Edit Public Profile</DialogTitle>
            <DialogDescription className="text-slate-400">
              This is how your profile appears in the public directory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name" className="text-slate-300">
                Display name
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Meister Müller"
                className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-orange/40"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="public-bio" className="text-slate-300">
                  Public bio
                </Label>
                <VoiceDictateButton
                  label="Dictate"
                  onAppend={(t) => setPublicBio((prev) => (prev ? `${prev} ${t}`.trim() : t))}
                />
              </div>
              <Textarea
                id="public-bio"
                value={publicBio}
                onChange={(e) => setPublicBio(e.target.value)}
                placeholder="Short intro shown to homeowners"
                rows={4}
                className="min-h-[110px] border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-orange/40"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setEditProfileOpen(false)}
              className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Public profile saved");
                setEditProfileOpen(false);
              }}
              className="bg-orange text-white hover:bg-orange/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="max-w-md border-white/10 bg-navy-deep text-white sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-white flex items-center gap-2">
              <Key className="size-5 text-orange" /> Reset Password
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose a new password. Minimum 8 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pw" className="text-slate-300">
                Current password
              </Label>
              <Input
                id="cur-pw"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
                className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-orange/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw" className="text-slate-300">
                New password
              </Label>
              <Input
                id="new-pw"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-orange/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw" className="text-slate-300">
                Confirm new password
              </Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-orange/40"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setResetPwOpen(false)}
              className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newPw.length < 8) {
                  toast.error("Password must be at least 8 characters");
                  return;
                }
                if (newPw !== confirmPw) {
                  toast.error("Passwords do not match");
                  return;
                }
                toast.success("Password updated");
                setCurrentPw("");
                setNewPw("");
                setConfirmPw("");
                setResetPwOpen(false);
              }}
              className="bg-orange text-white hover:bg-orange/90"
            >
              Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
