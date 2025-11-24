"use client";

import { useEffect, useState } from "react";

import { fetchInventory, InventoryRecord } from "@/data/inventory";
import { moveInventoryAction } from "@/app/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SessionNavbar } from "@/components/session-navbar";

type InventoryClientProps = {
  role: string | null;
};

export default function InventoryClient({ role }: InventoryClientProps) {
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canMove = role === "admin" || role === "operador";

  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await fetchInventory(50);

      if (queryError) {
        setError(queryError.message);
      } else {
        setItems(data);
      }

      setLoading(false);
    };

    loadInventory();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <SessionNavbar />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Dashboard</p>
          <h1 className="text-3xl font-semibold text-zinc-900">
            Inventario {role ? `(${role.toUpperCase()})` : ""}
          </h1>
          <p className="text-sm text-zinc-600">Visualiza stock, ubicaciones y prueba movimientos.</p>
        </div>
        {canMove && (
          <Button className="self-start sm:self-auto" variant="default">
            + Nuevo ingreso
          </Button>
        )}
      </div>

      {role === "auditor" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          👁️ Modo lectura: Solo visualización de stock.
        </div>
      )}

      {loading ? (
        <p>Cargando datos...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Stock overview</CardTitle>
              <CardDescription>Productos, ubicaciones y cantidades actuales.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-zinc-900">{item.products?.sku}</TableCell>
                      <TableCell>{item.products?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.locations?.code ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-zinc-900">
                        {item.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {items.length === 0 && (
                <div className="p-4 text-center text-zinc-400">No hay inventario registrado.</div>
              )}
            </CardContent>
          </Card>

          {canMove && (
            <Card>
              <CardHeader>
                <CardTitle>Simular movimiento</CardTitle>
                <CardDescription>Test rápido contra la RPC `move_inventory`.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={moveInventoryAction} className="flex flex-col gap-4 sm:grid sm:grid-cols-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="productId">ID Producto</Label>
                    <Input id="productId" name="productId" placeholder="UUID Producto" required />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fromLocationId">De (ID Ubicación)</Label>
                    <Input
                      id="fromLocationId"
                      name="fromLocationId"
                      placeholder="UUID Origen"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="toLocationId">Para (ID Ubicación)</Label>
                    <Input id="toLocationId" name="toLocationId" placeholder="UUID Destino" required />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input id="quantity" name="quantity" type="number" defaultValue="1" min="1" required />
                  </div>

                  <div className="flex items-end">
                    <Button type="submit" className="w-full">
                      Mover stock
                    </Button>
                  </div>
                </form>
                <p className="mt-3 text-xs text-zinc-500">
                  Copia los UUIDs de Supabase o imprime los items en consola para reutilizarlos.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
