import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ProfileClient from "./profile-client";

import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Perfil | JP Marjeda Warehouse",
  description: "Actualiza tu información personal, rol visible y estado de cuenta.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? (await getUserRole())) || "operador";

  return (
    <ProfileClient
      role={role}
      profile={{
        email: user.email ?? "",
        username: profile?.username ?? "",
        full_name: profile?.full_name ?? "",
        role,
        is_active: profile?.is_active ?? true,
      }}
    />
  );
}
