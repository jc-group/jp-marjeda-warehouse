"use client";

import { useActionState, useEffect } from "react";

import { createUserAction } from "@/app/actions/user-actions";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type UsersClientProps = {
  role: string | null;
};

export default function UsersClient({ role }: UsersClientProps) {
  const [state, action, pending] = useActionState(createUserAction, { success: false, message: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Listo" : "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <AdminShell role={role as any}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Usuarios y Roles</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Crear usuario</h1>
          <p className="text-sm text-zinc-600">Alta rápida de cuentas con rol y perfil.</p>
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Nuevo usuario</CardTitle>
            <CardDescription>Crear en Supabase Auth y en user_profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="correo@empresa.com" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input id="full_name" name="full_name" placeholder="Nombre y Apellido" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue="operador"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/50 focus:ring-offset-2"
                >
                  <option value="admin">Admin</option>
                  <option value="operador">Operador</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>

              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? "Creando..." : "Crear usuario"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
