"use client";

import { useRef, useState, useEffect } from "react";
import { useActionState } from "react";

import { createProductAction } from "@/app/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AdminShell } from "@/components/admin-shell";

type ProductFormClientProps = {
  role: string | null;
};

export default function ProductFormClient({ role }: ProductFormClientProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, action, pending] = useActionState(createProductAction, { success: false, message: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? "Listo" : "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <AdminShell role={role}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Productos</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Registrar producto</h1>
          <p className="text-sm text-zinc-600">SKU, nombre, descripción, imagen y ubicación inicial.</p>
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Ficha maestra</CardTitle>
            <CardDescription>Datos básicos del SKU.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={action}
              className="space-y-3"
              onReset={() => {
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" placeholder="Ej: FIL-001" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" placeholder="Filtro de aceite" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" placeholder="Opcional" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="originalCostPrice">Costo original (factura proveedor)</Label>
                  <Input
                    id="originalCostPrice"
                    name="originalCostPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 25.50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="originalCurrencyCode">Divisa de origen</Label>
                  <select
                    id="originalCurrencyCode"
                    name="originalCurrencyCode"
                    defaultValue="MXN"
                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2"
                  >
                    <option value="MXN">MXN - Peso mexicano</option>
                    <option value="USD">USD - Dólar estadounidense</option>
                  </select>
                  <p className="text-xs text-zinc-500">
                    La conversión a MXN se calcula automáticamente en el caso de uso.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="minStock">Stock mínimo</Label>
                  <Input id="minStock" name="minStock" type="number" min="0" defaultValue="0" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="taxRate">Tasa IVA</Label>
                  <Input id="taxRate" name="taxRate" type="number" step="0.01" defaultValue="0.16" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="location">Ubicación inicial (opcional)</Label>
                <Input id="location" name="location" placeholder="Ej: A-01-01" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="initialQuantity">Cantidad inicial (opcional)</Label>
                <Input id="initialQuantity" name="initialQuantity" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="image">Foto o imagen</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    aria-label="Subir foto o imagen"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setPreviewUrl(url);
                      } else {
                        setPreviewUrl(null);
                      }
                    }}
                  />
                  <label
                    htmlFor="image"
                    className="inline-flex w-fit cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
                  >
                    Seleccionar archivo
                  </label>
                </div>
                {previewUrl && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    <img src={previewUrl} alt="Vista previa" className="h-32 w-full object-cover" />
                  </div>
                )}
                <p className="text-xs text-zinc-500">
                  Sube o toma una foto; si no adjuntas nada usaremos la imagen por defecto.
                </p>
              </div>

              <div className="flex items-center justify-end">
                <Button type="submit" variant="secondary" className="w-full sm:w-auto" disabled={pending}>
                  {pending ? "Guardando..." : "Guardar producto"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
