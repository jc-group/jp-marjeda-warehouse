import { PlaceholderPage } from "@/components/placeholder-page";
import { getUserRole } from "@/core/use-cases/get-user-role";

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
