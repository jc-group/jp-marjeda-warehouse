"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function createUserAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const email = (formData.get("email") as string | null)?.trim();
  const password = (formData.get("password") as string | null)?.trim();
  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const role = (formData.get("role") as string | null)?.trim() || "operador";

  if (!email || !password) {
    return { success: false, message: "Email y contraseña son requeridos." };
  }

  try {
    const admin = await createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      throw new Error(error?.message || "No se pudo crear el usuario.");
    }

    const supabase = await createClient();
    const { error: profileError } = await supabase.from("user_profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      role,
      is_active: true,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    revalidatePath("/admin/users");
    return { success: true, message: "Usuario creado correctamente." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear usuario.";
    console.error("createUserAction:", err);
    return { success: false, message };
  }
}
