import { getUserProfile } from "@/src/lib/api";
import { ProfileWorkspace } from "@/src/components/profile/ProfileWorkspace";
import { pageMetadata } from "@/src/lib/pageMetadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Profil",
  "Hantera konto, eget företag och målgrupp.",
);

export default async function ProfilePage() {
  const userProfile = await getUserProfile();

  return <ProfileWorkspace userProfile={userProfile} />;
}
