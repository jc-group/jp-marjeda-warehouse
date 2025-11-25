"use client";

import { useActionState, useEffect } from "react";

import { createLocationAction } from "@/app/actions/location-actions";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type LocationFormClientProps = {
  role: string | null;
};

export default function LocationFormClient({ role }: LocationFormClientProps) {
  const [state, action, pending] = useActionState(createLocationAction, { success: false, message: "" });
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
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Ubicaciones</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Registrar ubicación</h1>
          <p className="text-sm text-zinc-600">Agregar códigos de racks, pasillos o zonas.</p>
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Nueva ubicación</CardTitle>
            <CardDescription>Define código y tipo (rack, floor, dock, quarantine).</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="code">Código</Label>
                <Input id="code" name="code" placeholder="A-01-01" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/50 focus:ring-offset-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona tipo
                  </option>
                  <option value="rack">Rack</option>
                  <option value="floor">Floor</option>
                  <option value="dock">Dock</option>
                  <option value="quarantine">Quarantine</option>
                </select>
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
                {pending ? "Guardando..." : "Guardar ubicación"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
