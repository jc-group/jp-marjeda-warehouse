"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return redirect("/update-password?error=Las contraseñas no coinciden");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  return redirect("/inventory");
}
