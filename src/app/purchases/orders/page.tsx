import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupabasePurchasesRepository } from "@/infrastructure/supabase/purchases-repository";
import { getUserProfileFromRepo } from "@/infrastructure/supabase/user-repo";
import { redirect } from "next/navigation";

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);

export default async function PurchaseOrdersPage() {
  const user = await getUserProfileFromRepo();
  if (!user) {
    redirect("/login?redirect=/purchases/orders");
  }

  const repo = new SupabasePurchasesRepository();
  const [orders, suppliers] = await Promise.all([repo.listPurchaseOrders(), repo.listActiveSuppliers()]);
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.companyName]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.poNumber}</TableCell>
                <TableCell>{supplierMap.get(order.supplierId) ?? "-"}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{order.orderDate}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(order.totalAmount ?? 0, order.currencyCode)}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No hay órdenes de compra.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
