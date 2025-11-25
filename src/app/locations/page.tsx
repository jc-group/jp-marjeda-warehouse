import LocationFormClient from "./location-form-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export default async function LocationsPage() {
  const role = await getUserRole();
  return <LocationFormClient role={role} />;
}
