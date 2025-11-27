import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Reportes | JP Marjeda Warehouse",
  description: "Informes de inventario, rotación y auditoría de operaciones.",
};

export default async function ReportsPage() {
  const role = await getUserRole();
  return (
    <PlaceholderPage
      role={role}
      title="Reportes"
      description="Valoración de inventario, rotación y logs de auditoría."
    />
  );
}
