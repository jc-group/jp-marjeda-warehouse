"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { SupabasePurchasesRepository } from "@/infrastructure/supabase/purchases-repository";
import {
  AddItemToPurchaseRequest,
  ApprovePurchaseRequest,
  CreatePurchaseOrderFromRequest,
  CreatePurchaseRequest,
  RejectPurchaseRequest,
  SubmitPurchaseRequestForApproval,
} from "@/core/use-cases/purchases";
import { getUserProfileFromRepo } from "@/infrastructure/supabase/user-repo";
import type { CurrencyCode, PurchasePriority } from "@/core/domain/purchase";

export async function createPurchaseRequestAction(
  _prevState: { success: boolean; message?: string; requestId?: string },
  formData: FormData
) {
  const user = await getUserProfileFromRepo();
  if (!user) return { success: false, message: "Usuario no autenticado." };

  const supplierId = (formData.get("supplierId") as string | null) || null;
  const priority = ((formData.get("priority") as string | null) ?? "NORMAL") as PurchasePriority;
  const currencyCode = ((formData.get("currencyCode") as string | null) ?? "MXN") as CurrencyCode;
  const requiredDate = (formData.get("requiredDate") as string | null) || undefined;
  const notes = (formData.get("notes") as string | null) || undefined;

  try {
    const repo = new SupabasePurchasesRepository();
    const useCase = new CreatePurchaseRequest(repo);
    const pr = await useCase.execute({
      requester: user,
      supplierId,
      priority,
      currencyCode,
      requiredDate: requiredDate || undefined,
      notes: notes || undefined,
    });
    revalidatePath("/purchases/requests");
    return { success: true, requestId: pr.id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Error al crear" };
  }
}

export async function addPurchaseRequestItemAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const user = await getUserProfileFromRepo();
  if (!user) return { success: false, message: "Usuario no autenticado." };

  const requestId = (formData.get("requestId") as string | null) ?? "";
  const description = (formData.get("description") as string | null)?.trim() || "";
  const quantity = Number(formData.get("quantity") ?? 0);
  const unitPriceEstimated = Number(formData.get("unitPriceEstimated") ?? 0);
  const unitOfMeasure = (formData.get("unitOfMeasure") as string | null)?.trim() || "EA";
  const productId = (formData.get("productId") as string | null) || null;

  if (!requestId || !description || Number.isNaN(quantity) || Number.isNaN(unitPriceEstimated)) {
    return { success: false, message: "Datos de item incompletos." };
  }

  try {
    const repo = new SupabasePurchasesRepository();
    const { request } = await repo.getPurchaseRequestWithItems(requestId);
    const useCase = new AddItemToPurchaseRequest(repo);
    await useCase.execute({
      request,
      user,
      itemData: { productId, description, quantity, unitOfMeasure, unitPriceEstimated },
    });
    revalidatePath(`/purchases/requests/${requestId}`);
    revalidatePath("/purchases/requests");
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Error al agregar item" };
  }
}

export async function submitPurchaseRequestAction(formData: FormData) {
  const user = await getUserProfileFromRepo();
  if (!user) return { success: false, message: "Usuario no autenticado." };

  const requestId = (formData.get("requestId") as string | null) ?? "";
  if (!requestId) return { success: false, message: "Falta requestId." };

  try {
    const repo = new SupabasePurchasesRepository();
    const { request } = await repo.getPurchaseRequestWithItems(requestId);
    const useCase = new SubmitPurchaseRequestForApproval(repo);
    await useCase.execute({ request, user });

    revalidatePath(`/purchases/requests/${requestId}`);
    revalidatePath("/purchases/requests");
    return { success: true };
  } catch (error) {
    console.error("submitPurchaseRequestAction error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Error al enviar" };
  }
}

export async function approvePurchaseRequestAction(formData: FormData) {
  const user = await getUserProfileFromRepo();
  if (!user) return { success: false, message: "Usuario no autenticado." };

  const requestId = (formData.get("requestId") as string | null) ?? "";
  const comments = (formData.get("comments") as string | null) || undefined;
  if (!requestId) return { success: false, message: "Falta requestId." };

  try {
    const repo = new SupabasePurchasesRepository();
    const { request } = await repo.getPurchaseRequestWithItems(requestId);
    const useCase = new ApprovePurchaseRequest(repo);
    await useCase.execute({ request, approver: user, comments });

    revalidatePath(`/purchases/requests/${requestId}`);
    revalidatePath("/purchases/requests");
    return { success: true };
  } catch (error) {
    console.error("approvePurchaseRequestAction error:", error);
    return { success: false, message: error instanceof Error ? error.message : "No se pudo aprobar" };
  }
}

export async function rejectPurchaseRequestAction(formData: FormData) {
  const user = await getUserProfileFromRepo();
  if (!user) return { success: false, message: "Usuario no autenticado." };

  const requestId = (formData.get("requestId") as string | null) ?? "";
  const comments = (formData.get("comments") as string | null) || undefined;
  if (!requestId) return { success: false, message: "Falta requestId." };

  try {
    const repo = new SupabasePurchasesRepository();
    const { request } = await repo.getPurchaseRequestWithItems(requestId);
    const useCase = new RejectPurchaseRequest(repo);
    await useCase.execute({ request, approver: user, comments });

    revalidatePath(`/purchases/requests/${requestId}`);
    revalidatePath("/purchases/requests");
    return { success: true };
  } catch (error) {
    console.error("rejectPurchaseRequestAction error:", error);
    return { success: false, message: error instanceof Error ? error.message : "No se pudo rechazar" };
  }
}

export async function createPurchaseOrderAction(formData: FormData) {
  const user = await getUserProfileFromRepo();
  if (!user) return { success: false, message: "Usuario no autenticado." };

  const requestId = (formData.get("requestId") as string | null) ?? "";
  if (!requestId) return { success: false, message: "Falta requestId." };

  try {
    const repo = new SupabasePurchasesRepository();
    const { request } = await repo.getPurchaseRequestWithItems(requestId);
    const useCase = new CreatePurchaseOrderFromRequest(repo);
    const { purchaseOrder } = await useCase.execute({ request, buyer: user });

    revalidatePath(`/purchases/requests/${requestId}`);
    revalidatePath("/purchases/orders");
    redirect(`/purchases/orders?created=${purchaseOrder.id}`);
  } catch (error) {
    console.error("createPurchaseOrderAction error:", error);
    return { success: false, message: error instanceof Error ? error.message : "No se pudo crear la OC" };
  }
}
