"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { MoveInventory } from "@/core/use-cases/move-inventory";
import { RegisterProduct } from "@/core/use-cases/register-product";
import { SupabaseInventoryRepo } from "@/infrastructure/supabase/inventory-repo";
import { SupabaseUserRepo } from "@/infrastructure/supabase/user-repo";
import { SupabaseCurrencyRepo } from "@/infrastructure/supabase/currency-repo";
const DEFAULT_IMAGE_PATH = "default.webp";
const inventoryRepo = new SupabaseInventoryRepo();
const userRepo = new SupabaseUserRepo();
const moveInventoryUseCase = new MoveInventory(inventoryRepo, userRepo);
const registerProductUseCase = new RegisterProduct(inventoryRepo, userRepo, moveInventoryUseCase);
const currencyRepo = new SupabaseCurrencyRepo();

export async function createProductAction(formData: FormData) {
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
