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

  revalidatePath("/", "layout");
  return { success: true, message: "Login exitoso" };
}
