import type { Metadata } from "next";
import UsersClient from "./users-client";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Usuarios y roles | JP Marjeda Warehouse",
  description: "Administra cuentas internas, invitaciones y permisos por rol.",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const role = await getUserRole();
  return <UsersClient role={role} />;
}
