"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export async function createLocationAction(_prev: unknown, formData: FormData) {
  const code = (formData.get("code") as string | null)?.trim();
  const type = (formData.get("type") as string | null)?.trim() || null;

  if (!code) {
    return { success: false, message: "El código es requerido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert({
    code,
    type,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/locations");
  return { success: true, message: "Ubicación creada" };
}

export async function updateLocationAction(
  _prev: unknown,
  formData: FormData
) {
  const id = (formData.get("id") as string | null)?.trim();
  const code = (formData.get("code") as string | null)?.trim();
  const type = (formData.get("type") as string | null)?.trim() || null;

  if (!id || !code) {
    return { success: false, message: "ID y código son requeridos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({ code, type })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/locations");
  return { success: true, message: "Ubicación actualizada" };
}

export async function deleteLocationAction(formData: FormData) {
  const id = (formData.get("id") as string | null)?.trim();

  if (!id) {
    return { success: false, message: "ID requerido para eliminar." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/locations");
  return { success: true, message: "Ubicación eliminada" };
}
