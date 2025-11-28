import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  UserProfile,
} from "@/core/domain/purchase";
import type { PurchasesRepository } from "@/core/ports/purchases-repository";

type Input = {
  request: PurchaseRequest;
  buyer: UserProfile;
};

export class CreatePurchaseOrderFromRequest {
  constructor(private purchasesRepo: PurchasesRepository) {}

  async execute(params: Input): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] }> {
    if (params.request.status !== "APPROVED") {
      throw new Error("Solo solicitudes aprobadas pueden convertirse en OC.");
    }

    if (!params.buyer.is_active) {
      throw new Error("El comprador no está activo.");
    }

    if (!["admin", "operador"].includes(params.buyer.role)) {
      throw new Error("Sin permiso para crear órdenes de compra.");
    }

    const { items } = await this.purchasesRepo.getPurchaseRequestWithItems(params.request.id);
    if (!items.length) {
      throw new Error("No hay items para convertir a orden de compra.");
    }

    const poNumber = await this.purchasesRepo.generateNextPONumber();

    const { purchaseOrder, items: createdItems } = await this.purchasesRepo.createPurchaseOrderFromRequest({
      request: params.request,
      buyerId: params.buyer.id,
      poNumber,
      items,
    });

    await this.purchasesRepo.updatePurchaseRequestStatus(params.request.id, "CONVERTED_TO_PO");

    return { purchaseOrder, items: createdItems };
  }
}
