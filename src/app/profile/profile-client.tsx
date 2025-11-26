"use client";

import { useActionState } from "react";

import { sendResetPasswordEmailAction, updateAuthSelfAction, updateProfileAction } from "@/app/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/admin-shell";

type ProfileClientProps = {
  profile: {
    email: string;
    username: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
  role: string | null;
};

export default function ProfileClient({ profile, role }: ProfileClientProps) {
  const [state, action, pending] = useActionState(updateProfileAction, {
    success: false,
    message: "",
  });
  const [resetState, resetAction, resetPending] = useActionState(sendResetPasswordEmailAction, {
    success: false,
    message: "",
  });
  const [authState, authAction, authPending] = useActionState(updateAuthSelfAction, {
    success: false,
    message: "",
  });

  return (
    <AdminShell role={role as string | null}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-600">Perfil</p>
            <h1 className="text-3xl font-semibold text-zinc-900">Cuenta</h1>
            <p className="text-sm text-zinc-600">Actualiza tu información y credenciales.</p>
          </div>
          <Badge variant="outline">{profile.role}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de usuario</CardTitle>
            <CardDescription>Datos provenientes de Supabase Auth y perfil interno.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="current_email">Email actual</Label>
                <Input id="current_email" value={profile.email} disabled />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" defaultValue={profile.username} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>

              {state.message && (
                <p className={`text-sm ${state.success ? "text-emerald-600" : "text-red-600"}`}>
                  {state.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Envía un correo para restablecer tu contraseña.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={resetAction} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-700">Enviar link de restablecimiento a tu email actual.</p>
              </div>
              <Button type="submit" disabled={resetPending}>
                {resetPending ? "Enviando..." : "Enviar correo"}
              </Button>
            </form>
            {resetState.message && (
              <p className={`mt-2 text-sm ${resetState.success ? "text-emerald-600" : "text-red-600"}`}>
                {resetState.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actualizar Auth (email / contraseña)</CardTitle>
            <CardDescription>Cambia tus credenciales en Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={authAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="new_email">Nuevo email (opcional)</Label>
                <Input
                  id="new_email"
                  name="new_email"
                  type="email"
                  placeholder="nuevo@correo.com"
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="new_password">Nueva contraseña (opcional)</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    placeholder="Repite la nueva contraseña"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="submit" disabled={authPending}>
                  {authPending ? "Actualizando..." : "Actualizar Auth"}
                </Button>
              </div>
            </form>
            {authState.message && (
              <p className={`mt-2 text-sm ${authState.success ? "text-emerald-600" : "text-red-600"}`}>
                {authState.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
