import { UserRole } from "../domain/user";
import { getUserRoleFromRepo } from "@/infrastructure/supabase/user-repo";

export async function getUserRole(): Promise<UserRole | null> {
  return getUserRoleFromRepo();
}
