import type { ReactNode } from "react";

import { PurchasesNav } from "./purchases-nav";

function PurchasesShell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Purchases</h1>
          <p className="text-sm text-muted-foreground">Solicitudes, aprobaciones y órdenes de compra.</p>
        </div>
      </div>
      <PurchasesNav />
      <div>{children}</div>
    </div>
  );
}

export default function PurchasesLayout({ children }: { children: ReactNode }) {
  return <PurchasesShell>{children}</PurchasesShell>;
}
