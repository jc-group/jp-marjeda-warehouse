import { createClient } from "@/utils/supabase/server";
import { InventoryRecord } from "@/data/inventory";

export async function fetchInventoryFromRepo(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory")
    .select(
      `
      *,
      products (*),
      locations (*)
    `
    )
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data as InventoryRecord[]) ?? [];
}

export async function moveInventoryRpc(params: {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("move_inventory", {
    p_product_id: params.productId,
    p_from_location_id: params.fromLocationId,
    p_to_location_id: params.toLocationId,
    p_quantity: params.quantity,
  });

  if (error) {
    throw new Error(error.message);
  }
}
