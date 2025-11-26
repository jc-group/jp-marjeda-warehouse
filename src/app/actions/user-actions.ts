"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

async function ensureAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("Usuario no autenticado.");
  }
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if ((profile?.role ?? "").toLowerCase() !== "admin") {
    throw new Error("Solo un admin puede gestionar usuarios.");
  }
}

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

export async function updateUserAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  try {
    await ensureAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "No autorizado.";
    return { success: false, message };
  }

  const id = (formData.get("id") as string | null)?.trim();
  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const username = (formData.get("username") as string | null)?.trim() || null;
  const role = ((formData.get("role") as string | null)?.trim() || "operador").toLowerCase();
  const isActive = formData.get("is_active") === "true" || formData.get("is_active") === "on";

  if (!id) {
    return { success: false, message: "ID requerido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({
      full_name: fullName,
      username,
      role,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "Usuario actualizado." };
}

export async function deleteUserAction(formData: FormData) {
  try {
    await ensureAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "No autorizado.";
    return { success: false, message };
  }

  const id = (formData.get("id") as string | null)?.trim();
  if (!id) {
    return { success: false, message: "ID requerido." };
  }

  try {
    const admin = await createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      throw new Error(error.message);
    }
    const supabase = await createClient();
    await supabase.from("user_profiles").delete().eq("id", id);
    revalidatePath("/admin/users");
    return { success: true, message: "Usuario eliminado." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al eliminar usuario.";
    console.error("deleteUserAction:", err);
    return { success: false, message };
  }
}
