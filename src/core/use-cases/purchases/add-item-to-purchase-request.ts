import {
  CurrencyCode,
  PurchaseRequest,
  PurchaseRequestItem,
  UserProfile,
} from "@/core/domain/purchase";
import type { PurchasesRepository } from "@/core/ports/purchases-repository";

type Input = {
  request: PurchaseRequest;
  user: UserProfile;
  itemData: {
    productId?: string | null;
    description: string;
    quantity: number;
    unitOfMeasure?: string;
    unitPriceEstimated: number;
    currencyCode?: CurrencyCode;
    neededDate?: string;
  };
};

export class AddItemToPurchaseRequest {
  constructor(private purchasesRepo: PurchasesRepository) {}

  async execute(params: Input): Promise<{ item: PurchaseRequestItem; totalAmount: number }> {
    if (!params.user.is_active) {
      throw new Error("El usuario no está activo.");
    }

    const isOwner = params.user.id === params.request.requesterId;
    const isAdmin = params.user.role === "admin";
    if (!isOwner && !isAdmin) {
      throw new Error("Solo el solicitante o un admin pueden editar la solicitud.");
    }

    if (!["DRAFT", "REJECTED"].includes(params.request.status)) {
      throw new Error("La solicitud no es editable en su estado actual.");
    }

    const lineTotal = params.itemData.quantity * params.itemData.unitPriceEstimated;

    const item = await this.purchasesRepo.addPurchaseRequestItem({
      purchaseRequestId: params.request.id,
      productId: params.itemData.productId ?? null,
      description: params.itemData.description,
      quantity: params.itemData.quantity,
      unitOfMeasure: params.itemData.unitOfMeasure ?? "EA",
      unitPriceEstimated: params.itemData.unitPriceEstimated,
      currencyCode: params.itemData.currencyCode ?? params.request.currencyCode,
      lineTotal,
      neededDate: params.itemData.neededDate ?? null,
    });

    const totalAmount = await this.purchasesRepo.recalculatePurchaseRequestTotal(params.request.id);

    return { item, totalAmount };
  }
}
