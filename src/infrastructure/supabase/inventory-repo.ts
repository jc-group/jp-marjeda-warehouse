import { InventoryItem } from "@/core/domain/inventory";
import { Supplier } from "@/core/domain/supplier";
import { createClient } from "@/utils/supabase/server";
import { Product } from "@/core/domain/inventory";

const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const getImageUrl = (path: string | null) => {
  if (!path) return "/placeholder-box.png";
  if (path.startsWith("http")) return path;
  return `${PROJECT_URL}/storage/v1/object/public/products/${path}`;
};

type InventoryRow = {
  id: string;
  quantity: number;
  locations: { id: string; code: string };
  products: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    image_url: string | null;
  };
};

export async function getInventory(limit = 50): Promise<InventoryItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory")
    .select(
      `
      id,
      quantity,
      locations (id, code),
      products (id, sku, name, description, image_url)
    `
    )
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return [];

  return (data as InventoryRow[]).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    location: {
      id: item.locations.id,
      code: item.locations.code,
    },
    product: {
      id: item.products.id,
      sku: item.products.sku,
      name: item.products.name,
      description: item.products.description,
      imageUrl: getImageUrl(item.products.image_url),
    },
  }));
}

export async function findProductIdBySku(sku: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("id").eq("sku", sku).single();
  if (error || !data) throw new Error("SKU no encontrado");
  return data.id;
}

export async function findLocationIdByCode(code: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("locations").select("id").eq("code", code).single();
  if (error || !data) throw new Error("Ubicación no encontrada");
  return data.id;
}

export async function moveInventoryRpc(params: {
  productId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  quantity: number;
  userId: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("move_inventory", {
    p_product_id: params.productId,
    p_from_location_id: params.fromLocationId ?? null,
    p_to_location_id: params.toLocationId,
    p_quantity: params.quantity,
    p_user_id: params.userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export class SupabaseInventoryRepo {
  async findProductIdBySku(sku: string) {
    return findProductIdBySku(sku);
  }

  async findLocationIdByCode(code: string) {
    return findLocationIdByCode(code);
  }

  async moveInventory(params: {
    productId: string;
    fromLocationId: string | null;
    toLocationId: string | null;
    quantity: number;
    userId: string;
  }) {
    return moveInventoryRpc(params);
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, company_name, rfc")
      .eq("is_active", true)
      .order("company_name", { ascending: true });

    if (error) {
      console.error("Error fetching suppliers:", error);
      throw new Error("No se pudo cargar la lista de proveedores.");
    }

    return (data || []).map((item) => ({
      id: item.id,
      companyName: item.company_name,
      rfc: item.rfc,
    }));
  }

  async uploadImage(file: File): Promise<string> {
    const supabase = await createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage.from("products").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      console.error("Upload error:", error);
      throw new Error("No se pudo subir la imagen.");
    }

    return data.path;
  }

  async create(payload: {
    sku: string;
    name: string;
    description: string | null;
    image_url?: string | null;
    min_stock?: number | null;
    manufacturer_part_number?: string | null;
    supplier_id?: string | null;
    tax_rate?: number | null;
    original_cost_price: number;
    original_currency_code: string;
    current_mxn_cost: number;
  }): Promise<Product> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        sku: payload.sku,
        name: payload.name,
        description: payload.description,
        image_url: payload.image_url ?? null,
        min_stock: payload.min_stock ?? 0,
        manufacturer_part_number: payload.manufacturer_part_number ?? null,
        supplier_id: payload.supplier_id ?? null,
        tax_rate: payload.tax_rate ?? 0.16,
        original_cost_price: payload.original_cost_price,
        original_currency_code: payload.original_currency_code,
        current_mxn_cost: payload.current_mxn_cost,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Insert product error:", error);
      throw new Error("No se pudo crear el producto.");
    }

    return {
      id: data.id,
      sku: data.sku,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url ?? undefined,
      manufacturerPartNumber: data.manufacturer_part_number,
      supplierId: data.supplier_id,
      taxRate: data.tax_rate,
      minStock: data.min_stock,
      originalCostPrice: data.original_cost_price,
      originalCurrencyCode: data.original_currency_code,
      currentMxnCost: data.current_mxn_cost,
    };
  }
}
