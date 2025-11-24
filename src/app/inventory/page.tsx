import InventoryClient from "./inventory-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export default async function InventoryPage() {
  const role = await getUserRole();
  return <InventoryClient role={role} />;
}
