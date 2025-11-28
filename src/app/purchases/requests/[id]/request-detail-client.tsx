"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  addPurchaseRequestItemAction,
  approvePurchaseRequestAction,
  createPurchaseOrderAction,
  rejectPurchaseRequestAction,
  submitPurchaseRequestAction,
} from "@/app/actions/purchase-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { can, type PurchaseRequest, type PurchaseRequestItem, type UserProfile } from "@/core/domain/purchase";

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);

type Props = {
  request: PurchaseRequest;
  items: PurchaseRequestItem[];
  user: UserProfile;
  supplierName?: string;
  canEdit: boolean;
  canApprove: boolean;
  canCreatePO: boolean;
};

export function PurchaseRequestDetailClient({
  request,
  items,
  user,
  supplierName,
  canEdit,
  canApprove,
  canCreatePO,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [itemState, itemAction, itemPending] = useActionState(addPurchaseRequestItemAction, {
    success: false,
    message: "",
  });

  useEffect(() => {
    if (itemState.success) {
      router.refresh();
    }
    if (itemState.message) {
      toast({
        title: itemState.success ? "Listo" : "Error",
        description: itemState.message,
      });
    }
  }, [itemState, router, toast]);

  const canSubmit = useMemo(
    () => canEdit && can(user, "REQUEST_PURCHASE") && items.length > 0,
    [canEdit, user, items]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-start justify-between space-y-0">
          <div>
            <CardTitle>
              {request.requestNumber} {supplierName ? `· ${supplierName}` : ""}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Prioridad: {request.priority} · Estado: {request.status}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <form action={submitPurchaseRequestAction}>
                <input type="hidden" name="requestId" value={request.id} />
                <Button type="submit">Enviar a aprobación</Button>
              </form>
            )}
            {canCreatePO && (
              <form action={createPurchaseOrderAction}>
                <input type="hidden" name="requestId" value={request.id} />
                <Button type="submit" variant="secondary">
                  Crear OC
                </Button>
              </form>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Moneda: {request.currencyCode} · Total: {formatMoney(request.totalAmount ?? 0, request.currencyCode)}
          </p>
          {request.notes && <p className="text-sm">Notas: {request.notes}</p>}
          {request.requiredDate && <p className="text-sm">Fecha requerida: {request.requiredDate}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio estimado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-right">
                    {item.quantity} {item.unitOfMeasure}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.unitPriceEstimated, item.currencyCode)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.lineTotal, item.currencyCode)}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No hay items agregados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {canEdit && (
            <form action={itemAction} className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-4">
              <input type="hidden" name="requestId" value={request.id} />
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input id="quantity" name="quantity" type="number" step="0.01" min="0" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unitPriceEstimated">Precio estimado</Label>
                <Input
                  id="unitPriceEstimated"
                  name="unitPriceEstimated"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unitOfMeasure">Unidad</Label>
                <Input id="unitOfMeasure" name="unitOfMeasure" defaultValue="EA" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={itemPending}>
                  {itemPending ? "Agregando..." : "Agregar item"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>Aprobación</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3">
              <input type="hidden" name="requestId" value={request.id} />
              <div className="space-y-1">
                <Label htmlFor="comments">Comentarios</Label>
                <textarea
                  id="comments"
                  name="comments"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" formAction={approvePurchaseRequestAction}>
                  Aprobar
                </Button>
                <Button type="submit" variant="destructive" formAction={rejectPurchaseRequestAction}>
                  Rechazar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
