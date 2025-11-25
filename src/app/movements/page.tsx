import { PlaceholderPage } from "@/components/placeholder-page";
import { getUserRole } from "@/core/use-cases/get-user-role";

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
