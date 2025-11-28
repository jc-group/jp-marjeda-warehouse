import { createClient } from "@/utils/supabase/server";
import { UserRole } from "@/core/domain/user";
import type { UserProfile as PurchaseUserProfile } from "@/core/domain/purchase";

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
    .from("user_profiles")
    .select("role")
    .eq("id", targetId)
    .single();

  return (data?.role as UserRole | null) ?? null;
}

export async function getUserProfileFromRepo(userId?: string): Promise<PurchaseUserProfile | null> {
  const supabase = await createClient();
  const targetId = userId ?? (await getCurrentUser())?.id;
  if (!targetId) return null;

  const { data } = await supabase
    .from("user_profiles")
    .select("id, role, is_active, can_request_purchases, can_approve_purchases")
    .eq("id", targetId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    role: (data.role as PurchaseUserProfile["role"]) ?? "operador",
    is_active: data.is_active ?? false,
    can_request_purchases: data.can_request_purchases ?? false,
    can_approve_purchases: data.can_approve_purchases ?? false,
  };
}

export class SupabaseUserRepo {
  async getCurrentUser() {
    return getCurrentUser();
  }

  async getUserRole(userId?: string) {
    return getUserRoleFromRepo(userId);
  }

  async getUserProfile(userId?: string) {
    return getUserProfileFromRepo(userId);
  }
}
