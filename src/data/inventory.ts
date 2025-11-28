import { Database } from "@/infrastructure/supabase/types";
import { createClient } from "@/utils/supabase/client";

export type InventoryRecord =
  Database["public"]["Tables"]["inventory"]["Row"] & {
    products: Database["public"]["Tables"]["products"]["Row"] | null;
    locations: Database["public"]["Tables"]["locations"]["Row"] | null;
  };

export async function fetchInventory(limit = 50) {
  try {
    const supabase = createClient();
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
      return { data: [] as InventoryRecord[], error: new Error(error.message) };
    }

    return { data: (data as InventoryRecord[]) ?? [], error: null };
  } catch (err) {
    return {
      data: [] as InventoryRecord[],
      error:
        err instanceof Error
          ? err
          : new Error("Unexpected error while fetching inventory"),
    };
  }
}
