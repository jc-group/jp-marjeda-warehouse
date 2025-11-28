"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { MoveInventory } from "@/core/use-cases/move-inventory";
import { RegisterProduct } from "@/core/use-cases/register-product";
import { SupabaseInventoryRepo } from "@/infrastructure/supabase/inventory-repo";
import { SupabaseUserRepo } from "@/infrastructure/supabase/user-repo";
import { SupabaseCurrencyRepo } from "@/infrastructure/supabase/currency-repo";
import { TablesUpdate } from "@/infrastructure/supabase/types";
const DEFAULT_IMAGE_PATH = "default.webp";
const inventoryRepo = new SupabaseInventoryRepo();
const userRepo = new SupabaseUserRepo();
const moveInventoryUseCase = new MoveInventory(inventoryRepo, userRepo);
const registerProductUseCase = new RegisterProduct(inventoryRepo, userRepo, moveInventoryUseCase);
const currencyRepo = new SupabaseCurrencyRepo();

export async function createProductAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const supabase = await createClient();

  const sku = (formData.get("sku") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const initialLocation = (formData.get("location") as string | null)?.trim() || null;
  const initialQuantityRaw = formData.get("initialQuantity") as string | null;
  const initialQuantity = initialQuantityRaw ? parseInt(initialQuantityRaw) : 0;
  const taxRateRaw = (formData.get("taxRate") as string | null) ?? "";
  const taxRate = taxRateRaw ? parseFloat(taxRateRaw) : 0.16;
  const minStockRaw = (formData.get("minStock") as string | null) ?? "";
  const minStock = minStockRaw ? parseInt(minStockRaw) : 0;
  const originalCostRaw = (formData.get("originalCostPrice") as string | null) ?? "";
  const originalCostPrice = originalCostRaw ? parseFloat(originalCostRaw) : NaN;
  const originalCurrencyCode =
    (formData.get("originalCurrencyCode") as string | null)?.trim().toUpperCase() || "MXN";
  const supplierId = (formData.get("supplierId") as string | null)?.trim() || null;
  const imageFile = formData.get("image");
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (!sku || !name || !userId) {
    return { success: false, message: "Faltan datos o usuario no autenticado" };
  }

  if (Number.isNaN(originalCostPrice) || originalCostPrice < 0) {
    return { success: false, message: "El costo original debe ser un número válido." };
  }

  let exchangeRate = 1;

  try {
    exchangeRate = await currencyRepo.getExchangeRateToMxn(originalCurrencyCode);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo obtener la tasa de cambio.";
    return { success: false, message };
  }

  try {
    await registerProductUseCase.execute({
      sku,
      name,
      description: description || "",
      minStock,
      taxRate,
      originalCostPrice,
      originalCurrencyCode,
      exchangeRate,
      imageFile: imageFile instanceof File && imageFile.size > 0 ? imageFile : DEFAULT_IMAGE_PATH,
      supplierId: supplierId || undefined,
      initialQuantity: initialQuantity > 0 ? initialQuantity : 0,
      initialLocationCode: initialLocation || undefined,
      userId,
    });
    revalidatePath("/inventory");
    return { success: true, message: "Producto registrado" };
  } catch (err) {
    console.error("Error registrando producto:", err);
    const message = err instanceof Error ? err.message : "Error al registrar producto";
    return { success: false, message };
  }
}

export async function updateProductAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const supabase = await createClient();
  const id = (formData.get("id") as string | null)?.trim();
  const name = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const minStockRaw = (formData.get("minStock") as string | null) ?? "";
  const minStock = minStockRaw ? parseInt(minStockRaw) : 0;
  const taxRateRaw = (formData.get("taxRate") as string | null) ?? "";
  const taxRate = taxRateRaw ? parseFloat(taxRateRaw) : 0.16;
  const supplierId = (formData.get("supplierId") as string | null)?.trim() || null;
  const imageFile = formData.get("image");

  if (!id || !name) {
    return { success: false, message: "Faltan datos obligatorios (id o nombre)." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuario no autenticado" };
  }

  let imagePath: string | undefined;
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imagePath = await inventoryRepo.uploadImage(imageFile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo subir la imagen.";
      return { success: false, message };
    }
  }

  const updatePayload: TablesUpdate<"products"> = {
    name,
    description,
    min_stock: minStock,
    tax_rate: taxRate,
    supplier_id: supplierId,
  };

  if (imagePath) {
    updatePayload.image_url = imagePath;
  }

  const { error } = await supabase.from("products").update(updatePayload).eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/products/new");
  return { success: true, message: "Producto actualizado" };
}

export async function deleteProductAction(formData: FormData) {
  const supabase = await createClient();
  const id = (formData.get("id") as string | null)?.trim();

  if (!id) {
    return { success: false, message: "ID requerido para eliminar." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuario no autenticado" };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/products/new");
  return { success: true, message: "Producto eliminado" };
}
