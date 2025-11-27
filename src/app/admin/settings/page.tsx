import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Configuración | JP Marjeda Warehouse",
  description: "Ajustes generales del sistema y preferencias administrativas.",
};

export default async function AdminSettingsPage() {
  const role = await getUserRole();
  return (
    <PlaceholderPage
      role={role}
      title="Configuración"
      description="Ajustes generales del sistema."
    />
  );
}
