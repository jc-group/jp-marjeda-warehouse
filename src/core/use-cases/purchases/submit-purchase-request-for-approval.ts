import { PurchaseRequest, UserProfile, can } from "@/core/domain/purchase";
import type { PurchasesRepository } from "@/core/ports/purchases-repository";

type Input = {
  request: PurchaseRequest;
  user: UserProfile;
};

export class SubmitPurchaseRequestForApproval {
  constructor(private purchasesRepo: PurchasesRepository) {}

  async execute(params: Input): Promise<PurchaseRequest> {
    const { request, user } = params;

    if (!user.is_active) {
      throw new Error("El usuario no está activo.");
    }

    if (user.role !== "admin" && !can(user, "REQUEST_PURCHASE")) {
      throw new Error("Sin permiso para enviar solicitudes a aprobación.");
    }

    if (user.id !== request.requesterId && user.role !== "admin") {
      throw new Error("No puedes enviar esta solicitud.");
    }

    if (!["DRAFT", "REJECTED"].includes(request.status)) {
      throw new Error("Solo se pueden enviar solicitudes en borrador o rechazadas.");
    }

    const { items } = await this.purchasesRepo.getPurchaseRequestWithItems(request.id);
    if (!items.length) {
      throw new Error("Agrega al menos un item antes de enviar a aprobación.");
    }

    return this.purchasesRepo.updatePurchaseRequestStatus(request.id, "PENDING_APPROVAL");
  }
}
