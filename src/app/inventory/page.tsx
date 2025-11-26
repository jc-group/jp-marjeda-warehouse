import InventoryClient from "./inventory-client";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/core/use-cases/get-user-role";

export default async function InventoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const role = await getUserRole();
  return <InventoryClient role={role} />;
}
