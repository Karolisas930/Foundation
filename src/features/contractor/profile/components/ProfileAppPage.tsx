import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import {
  HandymanProfilePage,
  type FullPageTab,
} from "@/features/contractor/profile/components/HandymanProfilePage";
import { getDemoUser, setDemoUser } from "@/lib/demo-auth";
import { useEffect } from "react";

export function ProfileAppPage({
  initialPage,
  initialSpecialtySlug,
}: {
  initialPage: FullPageTab;
  initialSpecialtySlug?: string;
}) {
  useEffect(() => {
    if (!getDemoUser()) setDemoUser({ name: "You" });
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0f172a] text-slate-50">
      <TopBar showMenu />
      <div className="pb-24">
        <HandymanProfilePage
          initialPage={initialPage}
          initialSpecialtySlug={initialSpecialtySlug}
        />
      </div>
      <BottomBar />
    </div>
  );
}

export default ProfileAppPage;
