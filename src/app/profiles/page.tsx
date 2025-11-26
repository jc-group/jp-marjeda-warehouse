import ProfilesClient from "./profiles-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export default async function ProfilesPage() {
  const role = await getUserRole();
  return <ProfilesClient role={role} />;
}
