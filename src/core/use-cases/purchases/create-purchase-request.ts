import {
  CurrencyCode,
  PurchasePriority,
  PurchaseRequest,
  PurchaseRequestStatus,
  UserProfile,
  can,
} from "@/core/domain/purchase";
import type { PurchasesRepository } from "@/core/ports/purchases-repository";

type Input = {
  requester: UserProfile;
  supplierId?: string | null;
  priority?: PurchasePriority;
  currencyCode?: CurrencyCode;
  requiredDate?: string;
  notes?: string;
};

export class CreatePurchaseRequest {
  constructor(private purchasesRepo: PurchasesRepository) {}

  async execute(params: Input): Promise<PurchaseRequest> {
    if (!params.requester.is_active) {
      throw new Error("El usuario no está activo.");
    }

    if (!can(params.requester, "REQUEST_PURCHASE")) {
      throw new Error("Sin permiso para crear solicitudes de compra.");
    }

    const requestNumber = await this.purchasesRepo.generateNextRequestNumber();

    const payload: Omit<PurchaseRequest, "id"> = {
      requestNumber,
      requesterId: params.requester.id,
      supplierId: params.supplierId ?? null,
      priority: params.priority ?? "NORMAL",
      status: "DRAFT",
      currencyCode: params.currencyCode ?? "MXN",
      totalAmount: 0,
      requiredDate: params.requiredDate ?? null,
      notes: params.notes ?? null,
    };

    return this.purchasesRepo.createPurchaseRequest({
      ...payload,
      status: payload.status as PurchaseRequestStatus,
    });
  }
}
