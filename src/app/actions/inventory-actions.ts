"use server";

import { revalidatePath } from "next/cache";

import { moveInventory } from "@/core/use-cases/move-inventory";
import { getCurrentUser } from "@/infrastructure/supabase/user-repo";

export async function moveInventoryAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    console.error("moveInventoryAction: no autorizado");
    return;
  }

  const productId = formData.get("productId") as string;
  const fromLocationId = formData.get("fromLocationId") as string;
  const toLocationId = formData.get("toLocationId") as string;
  const quantity = parseInt(formData.get("quantity") as string);

  try {
    await moveInventory({
      productId,
      fromLocationId,
      toLocationId,
      quantity,
      userId: user.id,
    });
  } catch (err) {
    console.error("Error en movimiento:", err);
    return;
  }

  revalidatePath("/inventory");
}
