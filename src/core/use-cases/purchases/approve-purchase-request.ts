import { PurchaseRequest, UserProfile, can } from "@/core/domain/purchase";
import type { PurchasesRepository } from "@/core/ports/purchases-repository";

type Input = {
  request: PurchaseRequest;
  approver: UserProfile;
  comments?: string;
};

export class ApprovePurchaseRequest {
  constructor(private purchasesRepo: PurchasesRepository) {}

  async execute(params: Input) {
    const { approver, request } = params;

    if (!approver.is_active) {
      throw new Error("El usuario no está activo.");
    }

    if (!can(approver, "APPROVE_PURCHASE")) {
      throw new Error("Sin permiso para aprobar compras.");
    }

    if (approver.id === request.requesterId) {
      throw new Error("No puedes aprobar tu propia solicitud.");
    }

    if (request.status !== "PENDING_APPROVAL") {
      throw new Error("La solicitud no está pendiente de aprobación.");
    }

    const approval = await this.purchasesRepo.createApproval({
      purchaseRequestId: request.id,
      approverId: approver.id,
      status: "APPROVED",
      comments: params.comments ?? null,
    });

    const updatedRequest = await this.purchasesRepo.updatePurchaseRequestStatus(request.id, "APPROVED");

    return { approval, request: updatedRequest };
  }
}
