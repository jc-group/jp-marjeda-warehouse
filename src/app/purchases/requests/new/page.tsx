import { redirect } from "next/navigation";

import { SupabasePurchasesRepository } from "@/infrastructure/supabase/purchases-repository";
import { getUserProfileFromRepo } from "@/infrastructure/supabase/user-repo";
import { NewPurchaseRequestForm } from "./purchase-request-form";

export default async function NewPurchaseRequestPage() {
  const user = await getUserProfileFromRepo();
  if (!user) {
    redirect("/login?redirect=/purchases/requests/new");
  }

  const canRequest = user.is_active && (user.role === "admin" || user.can_request_purchases);
  if (!canRequest) {
    return <p className="text-sm text-muted-foreground">No tienes permisos para crear solicitudes.</p>;
  }

  const repo = new SupabasePurchasesRepository();
  const suppliers = await repo.listActiveSuppliers();

  return <NewPurchaseRequestForm suppliers={suppliers} />;
}
