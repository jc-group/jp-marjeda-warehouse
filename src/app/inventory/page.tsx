import type { Metadata } from "next";
import InventoryClient from "./inventory-client";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Inventario | JP Marjeda Warehouse",
  description: "Stock con fotos, ubicaciones y acciones rápidas de ingreso o salida.",
};

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
