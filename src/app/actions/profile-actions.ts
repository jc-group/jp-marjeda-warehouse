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
  const newEmail = (formData.get("new_email") as string | null)?.trim();
  const newPassword = (formData.get("new_password") as string | null)?.trim();
  const confirmPassword = (formData.get("confirm_password") as string | null)?.trim();

  if (newPassword && newPassword.length < 6) {
    return { success: false, message: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (newPassword && newPassword !== confirmPassword) {
    return { success: false, message: "Las contraseñas no coinciden." };
  }

  if (newEmail || newPassword) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      "";

    const { error: authError } = await supabase.auth.updateUser(
      {
        ...(newEmail ? { email: newEmail } : {}),
        ...(newPassword ? { password: newPassword } : {}),
      },
      newEmail && siteUrl
        ? {
            emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/profile`,
          }
        : undefined
    );

    if (authError) {
      return { success: false, message: authError.message };
    }
  }

  const { error } = await supabase.from("user_profiles").upsert({
    id: user.id,
    username,
    full_name: fullName,
    // rol/activo solo editable por admins en Users/Profiles
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

export async function sendResetPasswordEmailAction(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "";

  const redirectTo = `${siteUrl.replace(/\/$/, "")}/update-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Correo de restablecimiento enviado. Revisa tu bandeja." };
}

export async function updateAuthSelfAction(
  _prev: { success: boolean; message?: string },
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const newEmail = (formData.get("new_email") as string | null)?.trim();
  const newPassword = (formData.get("new_password") as string | null)?.trim();
  const confirmPassword = (formData.get("confirm_password") as string | null)?.trim();

  if (!newEmail && !newPassword) {
    return { success: false, message: "Ingresa email o contraseña para actualizar." };
  }

  if (newPassword && newPassword.length < 6) {
    return { success: false, message: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (newPassword && newPassword !== confirmPassword) {
    return { success: false, message: "Las contraseñas no coinciden." };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "";
  const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/profile&flow=email-change`;

  const { error } = await supabase.auth.updateUser(
    {
      ...(newEmail ? { email: newEmail } : {}),
      ...(newPassword ? { password: newPassword } : {}),
    },
    newEmail ? { emailRedirectTo: redirectTo } : undefined
  );

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Datos de Auth actualizados. Revisa tu correo si cambiaste email." };
}
