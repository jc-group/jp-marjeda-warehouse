"use client";

import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderPageProps = {
  role: string | null;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PlaceholderPage({ role, title, description, children }: PlaceholderPageProps) {
  return (
    <AdminShell role={role as any}>
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Sección</p>
          <h1 className="text-3xl font-semibold text-zinc-900">{title}</h1>
          {description && <p className="text-sm text-zinc-600">{description}</p>}
        </div>
        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Próximamente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">
              Estamos preparando esta vista. Mientras tanto, usa el menú para navegar a otras secciones.
            </p>
            {children}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
