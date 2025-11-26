"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { login } from "@/app/login/actions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { success: false, message: "" });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Listo" : "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  useEffect(() => {
    if (state.success) {
      router.push("/inventory");
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <p className="text-xs font-semibold uppercase text-emerald-600">Bienvenido</p>
          <CardTitle>Inicia sesión</CardTitle>
          <CardDescription>Accede al inventario con tus credenciales Supabase Auth.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tucorreo@correo.com"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {state.message && (
              <p className={`text-sm ${state.success ? "text-emerald-600" : "text-red-600"}`}>
                {state.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-xs text-zinc-500">
            ¿Sin cuenta? <span className="underline">Contacta al administrador para darte acceso.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
