import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Movimientos | JP Marjeda Warehouse",
  description: "Historial de ingresos, salidas y transferencias de inventario.",
};

export default async function MovementsPage() {
  const role = await getUserRole();
  return (
    <PlaceholderPage
      role={role}
      title="Movimientos"
      description="Historial de ingresos, salidas y transferencias."
    />
  );
}
