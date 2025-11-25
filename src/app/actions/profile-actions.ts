"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function updateProfileAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const username = (formData.get("username") as string | null)?.trim() || null;
  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const role = ((formData.get("role") as string | null)?.trim() || "operador").toLowerCase();
  const isActive = formData.get("is_active") === "on";

  const { error } = await supabase.from("user_profiles").upsert({
    id: user.id,
    username,
    full_name: fullName,
    role,
    is_active: isActive,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Perfil actualizado" };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}
