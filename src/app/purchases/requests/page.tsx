import Link from "next/link";

import { submitPurchaseRequestAction } from "@/app/actions/purchase-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { can, type PurchaseRequest } from "@/core/domain/purchase";
import { SupabasePurchasesRepository } from "@/infrastructure/supabase/purchases-repository";
import { getUserProfileFromRepo } from "@/infrastructure/supabase/user-repo";

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);

export default async function PurchaseRequestsPage() {
  const user = await getUserProfileFromRepo();
  if (!user) {
    return <p className="text-sm text-muted-foreground">Inicia sesión para ver solicitudes de compra.</p>;
  }

  const repo = new SupabasePurchasesRepository();
  const [requests, suppliers] = await Promise.all([
    repo.listPurchaseRequestsForUser(user),
    repo.listActiveSuppliers(),
  ]);
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.companyName]));

  const canSubmit = (request: PurchaseRequest) =>
    ["DRAFT", "REJECTED"].includes(request.status) && (can(user, "REQUEST_PURCHASE") || user.role === "admin");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Purchase Requests</CardTitle>
          <p className="text-sm text-muted-foreground">
            {user.role === "admin" ? "Todas las solicitudes" : "Solicitudes creadas por ti"}
          </p>
        </div>
        {can(user, "REQUEST_PURCHASE") && (
          <Button asChild>
            <Link href="/purchases/requests/new">Nueva solicitud</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.requestNumber}</TableCell>
                <TableCell>{request.supplierId ? supplierMap.get(request.supplierId) : "-"}</TableCell>
                <TableCell>{request.priority}</TableCell>
                <TableCell>{request.status}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(request.totalAmount ?? 0, request.currencyCode)}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/purchases/requests/${request.id}`}>Ver / Editar</Link>
                  </Button>
                  {canSubmit(request) && (
                    <form action={submitPurchaseRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <Button variant="outline" size="sm" type="submit">
                        Enviar a aprobación
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No hay solicitudes de compra aún.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
