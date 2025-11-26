"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function login(prevState: { success: boolean; message?: string }, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: "Credenciales inválidas" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("user_profiles").insert({
        id: user.id,
        full_name: (user.user_metadata?.full_name as string | null) ?? null,
        role: "operador",
        is_active: true,
      });
    }
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Login exitoso" };
}
