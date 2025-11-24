import { canMoveInventory } from "../domain/user";
import { moveInventoryRpc } from "@/infrastructure/supabase/inventory-repo";
import { getUserRoleFromRepo } from "@/infrastructure/supabase/user-repo";

export async function moveInventory(params: {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  userId: string;
}) {
  const role = await getUserRoleFromRepo(params.userId);

  if (!canMoveInventory(role)) {
    throw new Error("Acceso denegado: rol sin permiso para mover inventario");
  }

  await moveInventoryRpc(params);
}
