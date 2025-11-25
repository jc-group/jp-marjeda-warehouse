"use server";

import { revalidatePath } from "next/cache";
import { MoveInventory } from "@/core/use-cases/move-inventory";
import { SupabaseInventoryRepo } from "@/infrastructure/supabase/inventory-repo";
import { SupabaseUserRepo } from "@/infrastructure/supabase/user-repo";
import { createClient } from "@/utils/supabase/server";

const inventoryRepo = new SupabaseInventoryRepo();
const userRepo = new SupabaseUserRepo();
const moveInventoryUseCase = new MoveInventory(inventoryRepo, userRepo);

export async function registerMovementAction(_prevState: unknown, formData: FormData) {
  const sku = (formData.get("sku") as string | null)?.trim();
  const locationCode = (formData.get("location") as string | null)?.trim();
  const quantity = parseInt(formData.get("quantity") as string);
  const type = "IN" as const;

  if (!sku || !locationCode || Number.isNaN(quantity)) {
    return { success: false, message: "Faltan datos requeridos (SKU, Ubicación o Cantidad)." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) {
    return { success: false, message: "Usuario no autenticado" };
  }

  try {
    await moveInventoryUseCase.execute({
      sku,
      locationCode,
      quantity,
      type,
      userId,
    });
    revalidatePath("/inventory");
    return { success: true, message: "Movimiento registrado con éxito." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al mover inventario.";
    console.error("Error en movimiento:", error);
    return { success: false, message };
  }
}
