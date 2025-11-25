import { PlaceholderPage } from "@/components/placeholder-page";
import { getUserRole } from "@/core/use-cases/get-user-role";

export default async function SuppliersPage() {
  const role = await getUserRole();
  return (
    <PlaceholderPage
      role={role}
      title="Proveedores"
      description="Gestión de proveedores, RFC y términos de pago."
    />
  );
}
