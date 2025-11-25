import DashboardClient from "./dashboard-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export default async function HomePage() {
  const role = await getUserRole();
  return <DashboardClient role={role} />;
}
