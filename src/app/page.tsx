import type { Metadata } from "next";
import DashboardClient from "./dashboard-client";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Dashboard | JP Marjeda Warehouse",
  description: "Resumen del inventario y accesos rápidos a las operaciones diarias.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const role = await getUserRole();
  return <DashboardClient role={role} />;
}
