import { notFound, redirect } from "next/navigation";

import { can } from "@/core/domain/purchase";
import { SupabasePurchasesRepository } from "@/infrastructure/supabase/purchases-repository";
import { getUserProfileFromRepo } from "@/infrastructure/supabase/user-repo";
import { PurchaseRequestDetailClient } from "./request-detail-client";

type Params = { id: string };

export default async function PurchaseRequestDetailPage({ params }: { params: Params }) {
  const user = await getUserProfileFromRepo();
  if (!user) {
    redirect(`/login?redirect=/purchases/requests/${params.id}`);
  }

  const repo = new SupabasePurchasesRepository();
  const data = await repo.getPurchaseRequestWithItems(params.id).catch(() => null);
  if (!data) {
    notFound();
  }

  const suppliers = await repo.listActiveSuppliers();
  const supplierName =
    data.request.supplierId && suppliers.find((s) => s.id === data.request.supplierId)?.companyName;

  const editable = ["DRAFT", "REJECTED"].includes(data.request.status);
  const canEdit = editable && (user.role === "admin" || user.id === data.request.requesterId);
  const canApprove = data.request.status === "PENDING_APPROVAL" && can(user, "APPROVE_PURCHASE") && user.id !== data.request.requesterId;
  const canCreatePO = data.request.status === "APPROVED" && user.is_active && ["admin", "operador"].includes(user.role);

  return (
    <PurchaseRequestDetailClient
      request={data.request}
      items={data.items}
      user={user}
      supplierName={supplierName}
      canEdit={canEdit}
      canApprove={canApprove}
      canCreatePO={canCreatePO}
    />
  );
}
