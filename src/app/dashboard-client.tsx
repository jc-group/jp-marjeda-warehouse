"use client";

import { useMemo } from "react";

import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DashboardClientProps = {
  role: string | null;
};

export default function DashboardClient({ role }: DashboardClientProps) {
  const metrics = useMemo(
    () => [
      { label: "Valor inventario", value: "$120,500", trend: "+4.2% vs. mes anterior" },
      { label: "Alertas stock bajo", value: "8 SKUs", trend: "Revisar reorden" },
      { label: "Movimientos hoy", value: "34", trend: "Ing. 22 / Sal. 12" },
    ],
    []
  );

  const recent = useMemo(
    () => [
      { id: "MOV-1201", type: "Ingreso", sku: "FIL-001", qty: 50, location: "A-01-01" },
      { id: "MOV-1200", type: "Salida", sku: "BRK-220", qty: 10, location: "B-02-03" },
      { id: "MOV-1199", type: "Transfer", sku: "OIL-330", qty: 5, location: "A-03-02 → C-01-01" },
    ],
    []
  );

  return (
    <AdminShell role={role}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-emerald-600">Dashboard</p>
            <h1 className="text-3xl font-semibold text-zinc-900">Resumen operativo</h1>
            <p className="text-sm text-zinc-600">
              Vista rápida de stock, alertas y movimientos recientes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{role ?? "visitante"}</Badge>
            <Button variant="default" className="sm:w-auto w-full">
              Ver inventario
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-zinc-100 bg-white shadow-sm">
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-emerald-600">{metric.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Movimientos recientes</CardTitle>
            <CardDescription>Últimos ingresos, salidas y transferencias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((mov) => (
              <div
                key={mov.id}
                className="flex flex-col rounded-lg border border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900">
                    {mov.id} · {mov.type}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {mov.sku} · {mov.location}
                  </p>
                </div>
                <Badge variant="outline">Cantidad: {mov.qty}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Alertas rápidas</CardTitle>
            <CardDescription>SKU bajo mínimo y ubicaciones críticas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              FIL-001 en A-01-01 con 5 uds (min 20)
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              OIL-330 en C-01-01 con 2 uds (min 15)
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
