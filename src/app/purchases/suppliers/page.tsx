import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupabasePurchasesRepository } from "@/infrastructure/supabase/purchases-repository";
import { getUserProfileFromRepo } from "@/infrastructure/supabase/user-repo";

export default async function PurchaseSuppliersPage() {
  const user = await getUserProfileFromRepo();
  if (!user) {
    redirect("/login?redirect=/purchases/suppliers");
  }

  const repo = new SupabasePurchasesRepository();
  const suppliers = await repo.listActiveSuppliers();
  const isAdmin = user.role === "admin";

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Suppliers</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Administra proveedores para compras" : "Solo lectura"}
          </p>
        </div>
        {isAdmin && (
          <Button asChild variant="secondary">
            <Link href="/suppliers">Ir a gestión completa</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>RFC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.companyName}</TableCell>
                <TableCell>{supplier.rfc}</TableCell>
              </TableRow>
            ))}
            {suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                  No hay proveedores activos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
