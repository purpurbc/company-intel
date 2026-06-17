import {
  listCustomerAccounts,
  listSalesOffers,
  listSavedSegments,
  getUserProfile,
} from "@/src/lib/api";
import { ProfileWorkspace } from "@/src/components/profile/ProfileWorkspace";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [userProfile, segments, offers, customers] = await Promise.all([
    getUserProfile(),
    listSavedSegments(),
    listSalesOffers(),
    listCustomerAccounts(),
  ]);

  return (
    <ProfileWorkspace
      segments={segments.items}
      offers={offers.items}
      customers={customers.items}
      userProfile={userProfile}
    />
  );
}
