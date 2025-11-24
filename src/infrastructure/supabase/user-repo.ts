import { createClient } from "@/utils/supabase/server";
import { UserRole } from "@/core/domain/user";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function getUserRoleFromRepo(userId?: string): Promise<UserRole | null> {
  const supabase = await createClient();
  const targetId = userId ?? (await getCurrentUser())?.id;
  if (!targetId) return null;

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("id", targetId)
    .single();

  return (data?.role as UserRole | null) ?? null;
}
