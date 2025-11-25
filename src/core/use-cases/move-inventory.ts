import { canMoveInventory } from "../domain/user";
import { moveInventoryRpc } from "@/infrastructure/supabase/inventory-repo";
import { getUserRoleFromRepo } from "@/infrastructure/supabase/user-repo";

export async function moveInventory(params: {
  productId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  quantity: number;
  userId: string;
}) {
  const role = await getUserRoleFromRepo(params.userId);

  if (!canMoveInventory(role)) {
    throw new Error("Acceso denegado: rol sin permiso para mover inventario");
  }

  await moveInventoryRpc(params);
}

export class MoveInventory {
  constructor(
    private inventoryRepo: {
      findProductIdBySku(sku: string): Promise<string>;
      findLocationIdByCode(code: string): Promise<string>;
      moveInventory(params: {
        productId: string;
        fromLocationId: string | null;
        toLocationId: string | null;
        quantity: number;
      }): Promise<void>;
    },
    private userRepo: {
      getUserRole(userId?: string): Promise<string | null>;
      getCurrentUser?: () => Promise<{ id: string } | null>;
    }
  ) {}

  async execute(params: {
    sku: string;
    locationCode: string;
    quantity: number;
    type: "IN" | "OUT";
    userId: string;
  }) {
    const role = await this.userRepo.getUserRole(params.userId);
    if (!canMoveInventory(role)) {
      throw new Error("Acceso denegado: rol sin permiso para mover inventario");
    }

    const productId = await this.inventoryRepo.findProductIdBySku(params.sku);
    const locationId = await this.inventoryRepo.findLocationIdByCode(params.locationCode);

    await this.inventoryRepo.moveInventory({
      productId,
      fromLocationId: params.type === "OUT" ? locationId : null,
      toLocationId: params.type === "IN" ? locationId : null,
      quantity: params.quantity,
    });
  }
}
