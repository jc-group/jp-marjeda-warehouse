"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createPurchaseRequestAction } from "@/app/actions/purchase-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Supplier } from "@/core/domain/supplier";

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

const currencies = ["MXN", "USD", "EUR"];

type Props = {
  suppliers: Supplier[];
};

export function NewPurchaseRequestForm({ suppliers }: Props) {
  const [state, action, pending] = useActionState(createPurchaseRequestAction, {
    success: false,
    message: "",
    requestId: "",
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.success && state.requestId) {
      toast({ title: "Solicitud creada", description: "Ahora agrega items y envíala a aprobación." });
      router.push(`/purchases/requests/${state.requestId}`);
    } else if (state.message) {
      toast({ title: "Error", description: state.message });
    }
  }, [router, state, toast]);

  return (
    <form action={action} className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="supplierId">Proveedor</Label>
        <select
          id="supplierId"
          name="supplierId"
          className="w-full rounded-md border px-3 py-2 text-sm"
          defaultValue=""
        >
          <option value="">Sin proveedor</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.companyName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <select id="priority" name="priority" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="NORMAL">
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currencyCode">Moneda</Label>
          <select
            id="currencyCode"
            name="currencyCode"
            className="w-full rounded-md border px-3 py-2 text-sm"
            defaultValue="MXN"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="requiredDate">Fecha requerida</Label>
          <Input id="requiredDate" name="requiredDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <textarea
            id="notes"
            name="notes"
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={3}
            placeholder="Instrucciones adicionales"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando..." : "Crear solicitud"}
        </Button>
        {state.message && !state.success && (
          <p className="text-sm text-muted-foreground">{state.message}</p>
        )}
      </div>
    </form>
  );
}
