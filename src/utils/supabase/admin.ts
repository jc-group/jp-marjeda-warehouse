"use server";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/infrastructure/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createAdminClient(): Promise<SupabaseClient<Database>> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Faltan variables de entorno para Supabase admin (SUPABASE_SERVICE_ROLE_KEY).");
  }

  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
