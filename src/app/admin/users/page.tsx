import UsersClient from "./users-client";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/core/use-cases/get-user-role";

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
