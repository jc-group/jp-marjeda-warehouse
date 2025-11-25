"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/app/actions/profile-actions";
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

  return (
    <AdminShell role={role as any}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-600">Perfil</p>
            <h1 className="text-3xl font-semibold text-zinc-900">Cuenta</h1>
            <p className="text-sm text-zinc-600">Actualiza tu información y rol.</p>
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
                <Label htmlFor="email">Email (Auth)</Label>
                <Input id="email" name="email" value={profile.email} readOnly />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" defaultValue={profile.username} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="role">Rol</Label>
                <Input id="role" name="role" defaultValue={profile.role} />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  defaultChecked={profile.is_active}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_active">Activo</Label>
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
      </div>
    </AdminShell>
  );
}
