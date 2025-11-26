import SuppliersClient from "./suppliers-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export default async function SuppliersPage() {
  const role = await getUserRole();
  return <SuppliersClient role={role} />;
}
