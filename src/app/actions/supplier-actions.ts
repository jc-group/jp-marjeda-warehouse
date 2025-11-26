"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export async function createSupplierAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const companyName = (formData.get("companyName") as string | null)?.trim();
  const rfc = (formData.get("rfc") as string | null)?.trim().toUpperCase();
  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const contactPerson = (formData.get("contactPerson") as string | null)?.trim() || null;
  const paymentTerms =
    (formData.get("paymentTerms") as string | null)?.trim() || "Net 30";
  const deliveryTimeRaw = (formData.get("deliveryTimeDays") as string | null)?.trim() || "";
  const deliveryTimeDays =
    deliveryTimeRaw && !Number.isNaN(Number(deliveryTimeRaw))
      ? Number(deliveryTimeRaw)
      : 7;
  const addressStreet = (formData.get("addressStreet") as string | null)?.trim() || null;
  const addressCity = (formData.get("addressCity") as string | null)?.trim() || null;
  const addressState = (formData.get("addressState") as string | null)?.trim() || null;
  const addressZipCode = (formData.get("addressZipCode") as string | null)?.trim() || null;

  if (!companyName || !rfc) {
    return { success: false, message: "Empresa y RFC son obligatorios." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuario no autenticado." };
  }

  // Solo admin puede crear proveedores
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile?.role ?? "").toLowerCase() !== "admin") {
    return { success: false, message: "Solo un admin puede crear proveedores." };
  }

  const { error } = await supabase.from("suppliers").insert({
    company_name: companyName,
    rfc,
    email,
    phone,
    contact_person: contactPerson,
    payment_terms: paymentTerms,
    delivery_time_days: deliveryTimeDays,
    address_street: addressStreet,
    address_city: addressCity,
    address_state: addressState,
    address_zip_code: addressZipCode,
    is_active: true,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/suppliers");
  return { success: true, message: "Proveedor creado correctamente." };
}

export async function updateSupplierAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const id = (formData.get("id") as string | null)?.trim();
  const companyName = (formData.get("companyName") as string | null)?.trim();
  const rfc = (formData.get("rfc") as string | null)?.trim()?.toUpperCase();
  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const contactPerson = (formData.get("contactPerson") as string | null)?.trim() || null;
  const paymentTerms =
    (formData.get("paymentTerms") as string | null)?.trim() || "Net 30";
  const deliveryTimeRaw = (formData.get("deliveryTimeDays") as string | null)?.trim() || "";
  const deliveryTimeDays =
    deliveryTimeRaw && !Number.isNaN(Number(deliveryTimeRaw))
      ? Number(deliveryTimeRaw)
      : 7;
  const addressStreet = (formData.get("addressStreet") as string | null)?.trim() || null;
  const addressCity = (formData.get("addressCity") as string | null)?.trim() || null;
  const addressState = (formData.get("addressState") as string | null)?.trim() || null;
  const addressZipCode = (formData.get("addressZipCode") as string | null)?.trim() || null;
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  if (!id || !companyName || !rfc) {
    return { success: false, message: "Faltan datos obligatorios (id, empresa o RFC)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile?.role ?? "").toLowerCase() !== "admin") {
    return { success: false, message: "Solo un admin puede actualizar proveedores." };
  }

  const { error } = await supabase
    .from("suppliers")
    .update({
      company_name: companyName,
      rfc,
      email,
      phone,
      contact_person: contactPerson,
      payment_terms: paymentTerms,
      delivery_time_days: deliveryTimeDays,
      address_street: addressStreet,
      address_city: addressCity,
      address_state: addressState,
      address_zip_code: addressZipCode,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/suppliers");
  return { success: true, message: "Proveedor actualizado." };
}

export async function deleteSupplierAction(formData: FormData) {
  const id = (formData.get("id") as string | null)?.trim();

  if (!id) {
    return { success: false, message: "ID requerido para eliminar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile?.role ?? "").toLowerCase() !== "admin") {
    return { success: false, message: "Solo un admin puede eliminar proveedores." };
  }

  const { error } = await supabase.from("suppliers").delete().eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/suppliers");
  return { success: true, message: "Proveedor eliminado." };
}
