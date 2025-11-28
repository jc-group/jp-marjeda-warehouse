import {
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseRequestStatus,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequestApproval,
  PurchasePriority,
  CurrencyCode,
  UserProfile,
} from "@/core/domain/purchase";
import type { PurchasesRepository } from "@/core/ports/purchases-repository";
import type { Supplier } from "@/core/domain/supplier";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "./types";

type Db = Database["public"]["Tables"];

const mapPurchaseRequest = (row: Db["purchase_requests"]["Row"]): PurchaseRequest => ({
  id: row.id,
  requestNumber: row.request_number,
  requesterId: row.requester_id,
  supplierId: row.supplier_id,
  priority: row.priority as PurchasePriority,
  status: row.status as PurchaseRequestStatus,
  currencyCode: row.currency_code as CurrencyCode,
  totalAmount: Number(row.total_amount ?? 0),
  requiredDate: row.required_date,
  notes: row.notes,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

const mapPurchaseRequestItem = (row: Db["purchase_request_items"]["Row"]): PurchaseRequestItem => ({
  id: row.id,
  purchaseRequestId: row.purchase_request_id,
  productId: row.product_id,
  description: row.description,
  quantity: Number(row.quantity),
  unitOfMeasure: row.unit_of_measure,
  unitPriceEstimated: Number(row.unit_price_estimated),
  currencyCode: row.currency_code as CurrencyCode,
  lineTotal: Number(row.line_total),
  neededDate: row.needed_date,
  createdAt: row.created_at ?? undefined,
});

const mapPurchaseRequestApproval = (
  row: Db["purchase_request_approvals"]["Row"]
): PurchaseRequestApproval => ({
  id: row.id,
  purchaseRequestId: row.purchase_request_id,
  approverId: row.approver_id,
  level: row.level ?? 1,
  status: row.status as PurchaseRequestApproval["status"],
  decisionAt: row.decision_at,
  comments: row.comments,
  createdAt: row.created_at ?? undefined,
});

const mapPurchaseOrder = (row: Db["purchase_orders"]["Row"]): PurchaseOrder => ({
  id: row.id,
  poNumber: row.po_number,
  purchaseRequestId: row.purchase_request_id,
  buyerId: row.buyer_id,
  supplierId: row.supplier_id,
  status: row.status as PurchaseOrder["status"],
  currencyCode: row.currency_code as CurrencyCode,
  totalAmount: Number(row.total_amount ?? 0),
  orderDate: row.order_date,
  expectedDeliveryDate: row.expected_delivery_date,
  notes: row.notes,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

const mapPurchaseOrderItem = (row: Db["purchase_order_items"]["Row"]): PurchaseOrderItem => ({
  id: row.id,
  purchaseOrderId: row.purchase_order_id,
  productId: row.product_id,
  description: row.description,
  quantity: Number(row.quantity),
  unitOfMeasure: row.unit_of_measure,
  unitPrice: Number(row.unit_price),
  currencyCode: row.currency_code as CurrencyCode,
  lineTotal: Number(row.line_total),
  createdAt: row.created_at ?? undefined,
});

export class SupabasePurchasesRepository implements PurchasesRepository {
  private async client() {
    return createClient();
  }

  private buildSequentialCode(prefix: string, latest: string | null): string {
    const year = new Date().getFullYear();
    const base = `${prefix}-${year}-`;
    const lastNumber = latest?.startsWith(base)
      ? parseInt(latest.replace(base, ""), 10)
      : 0;
    const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
    return `${base}${String(next).padStart(5, "0")}`;
  }

  async generateNextRequestNumber(): Promise<string> {
    const supabase = await this.client();
    const year = new Date().getFullYear();
    const prefix = `PR-${year}-`;
    const { data, error } = await supabase
      .from("purchase_requests")
      .select("request_number")
      .ilike("request_number", `${prefix}%`)
      .order("request_number", { ascending: false })
      .limit(1);

    if (error) {
      console.error("generateNextRequestNumber error:", error);
      throw new Error("No se pudo generar el folio de solicitud.");
    }

    const latest = data?.[0]?.request_number ?? null;
    return this.buildSequentialCode("PR", latest);
  }

  async generateNextPONumber(): Promise<string> {
    const supabase = await this.client();
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("po_number")
      .ilike("po_number", `${prefix}%`)
      .order("po_number", { ascending: false })
      .limit(1);

    if (error) {
      console.error("generateNextPONumber error:", error);
      throw new Error("No se pudo generar el folio de orden de compra.");
    }

    const latest = data?.[0]?.po_number ?? null;
    return this.buildSequentialCode("PO", latest);
  }

  async createPurchaseRequest(input: {
    requestNumber: string;
    requesterId: string;
    supplierId?: string | null;
    priority: PurchasePriority;
    currencyCode: CurrencyCode;
    requiredDate?: string | null;
    notes?: string | null;
    status: PurchaseRequestStatus;
    totalAmount: number;
  }): Promise<PurchaseRequest> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("purchase_requests")
      .insert({
        request_number: input.requestNumber,
        requester_id: input.requesterId,
        supplier_id: input.supplierId ?? null,
        priority: input.priority,
        status: input.status,
        currency_code: input.currencyCode,
        total_amount: input.totalAmount,
        required_date: input.requiredDate ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("createPurchaseRequest error:", error);
      throw new Error("No se pudo crear la solicitud de compra.");
    }

    return mapPurchaseRequest(data);
  }

  async addPurchaseRequestItem(input: {
    purchaseRequestId: string;
    productId?: string | null;
    description: string;
    quantity: number;
    unitOfMeasure: string;
    unitPriceEstimated: number;
    currencyCode: CurrencyCode;
    lineTotal: number;
    neededDate?: string | null;
  }): Promise<PurchaseRequestItem> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("purchase_request_items")
      .insert({
        purchase_request_id: input.purchaseRequestId,
        product_id: input.productId ?? null,
        description: input.description,
        quantity: input.quantity,
        unit_of_measure: input.unitOfMeasure,
        unit_price_estimated: input.unitPriceEstimated,
        currency_code: input.currencyCode,
        line_total: input.lineTotal,
        needed_date: input.neededDate ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("addPurchaseRequestItem error:", error);
      throw new Error("No se pudo agregar el item.");
    }

    return mapPurchaseRequestItem(data);
  }

  async recalculatePurchaseRequestTotal(purchaseRequestId: string): Promise<number> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("purchase_request_items")
      .select("line_total")
      .eq("purchase_request_id", purchaseRequestId);

    if (error) {
      console.error("recalculatePurchaseRequestTotal error:", error);
      throw new Error("No se pudo recalcular el total.");
    }

    const total = (data ?? []).reduce((sum, item) => sum + Number(item.line_total ?? 0), 0);

    const { error: updateError } = await supabase
      .from("purchase_requests")
      .update({ total_amount: total })
      .eq("id", purchaseRequestId);

    if (updateError) {
      console.error("update total error:", updateError);
      throw new Error("No se pudo actualizar el total de la solicitud.");
    }

    return total;
  }

  async updatePurchaseRequestStatus(id: string, status: PurchaseRequestStatus): Promise<PurchaseRequest> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("purchase_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("updatePurchaseRequestStatus error:", error);
      throw new Error("No se pudo actualizar el estado de la solicitud.");
    }

    return mapPurchaseRequest(data);
  }

  async getPurchaseRequestWithItems(id: string): Promise<{ request: PurchaseRequest; items: PurchaseRequestItem[] }> {
    const supabase = await this.client();
    const [{ data: requestData, error: requestError }, { data: itemsData, error: itemsError }] = await Promise.all([
      supabase.from("purchase_requests").select("*").eq("id", id).single(),
      supabase
        .from("purchase_request_items")
        .select("*")
        .eq("purchase_request_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (requestError || !requestData) {
      console.error("getPurchaseRequestWithItems request error:", requestError);
      throw new Error("No se encontró la solicitud de compra.");
    }

    if (itemsError) {
      console.error("getPurchaseRequestWithItems items error:", itemsError);
      throw new Error("No se pudieron cargar los items de la solicitud.");
    }

    return {
      request: mapPurchaseRequest(requestData),
      items: (itemsData ?? []).map(mapPurchaseRequestItem),
    };
  }

  async createApproval(input: {
    purchaseRequestId: string;
    approverId: string;
    level?: number;
    status: "APPROVED" | "REJECTED";
    comments?: string | null;
  }): Promise<PurchaseRequestApproval> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("purchase_request_approvals")
      .insert({
        purchase_request_id: input.purchaseRequestId,
        approver_id: input.approverId,
        level: input.level ?? 1,
        status: input.status,
        decision_at: new Date().toISOString(),
        comments: input.comments ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("createApproval error:", error);
      throw new Error("No se pudo registrar la aprobación/rechazo.");
    }

    return mapPurchaseRequestApproval(data);
  }

  async createPurchaseOrderFromRequest(input: {
    request: PurchaseRequest;
    buyerId: string;
    poNumber: string;
    items: PurchaseRequestItem[];
  }): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] }> {
    if (!input.request.supplierId) {
      throw new Error("La solicitud no tiene proveedor asignado.");
    }

    const supabase = await this.client();
    const { data: poData, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        po_number: input.poNumber,
        purchase_request_id: input.request.id,
        buyer_id: input.buyerId,
        supplier_id: input.request.supplierId,
        status: "OPEN",
        currency_code: input.request.currencyCode,
        total_amount: input.request.totalAmount,
        expected_delivery_date: input.request.requiredDate ?? null,
        notes: input.request.notes ?? null,
      })
      .select()
      .single();

    if (poError || !poData) {
      console.error("createPurchaseOrder error:", poError);
      throw new Error("No se pudo crear la orden de compra.");
    }

    const itemsPayload = input.items.map((item) => ({
      purchase_order_id: poData.id,
      product_id: item.productId ?? null,
      description: item.description,
      quantity: item.quantity,
      unit_of_measure: item.unitOfMeasure,
      unit_price: item.unitPriceEstimated,
      currency_code: item.currencyCode,
      line_total: item.lineTotal,
    }));

    const { data: poItemsData, error: poItemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsPayload)
      .select();

    if (poItemsError || !poItemsData) {
      console.error("createPurchaseOrder items error:", poItemsError);
      throw new Error("La orden se creó, pero no se pudieron copiar los items.");
    }

    return {
      purchaseOrder: mapPurchaseOrder(poData),
      items: poItemsData.map(mapPurchaseOrderItem),
    };
  }

  async listPurchaseRequestsForUser(user: UserProfile): Promise<PurchaseRequest[]> {
    const supabase = await this.client();
    const query = supabase.from("purchase_requests").select("*").order("created_at", { ascending: false });
    const finalQuery =
      user.role === "admin"
        ? query
        : query.eq("requester_id", user.id);

    const { data, error } = await finalQuery;

    if (error) {
      console.error("listPurchaseRequestsForUser error:", error);
      throw new Error("No se pudieron cargar las solicitudes de compra.");
    }

    return (data ?? []).map(mapPurchaseRequest);
  }

  async listPurchaseOrders(): Promise<PurchaseOrder[]> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listPurchaseOrders error:", error);
      throw new Error("No se pudieron cargar las órdenes de compra.");
    }

    return (data ?? []).map(mapPurchaseOrder);
  }

  async listActiveSuppliers(): Promise<Supplier[]> {
    const supabase = await this.client();
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, company_name, rfc")
      .eq("is_active", true)
      .order("company_name", { ascending: true });

    if (error) {
      console.error("listActiveSuppliers error:", error);
      throw new Error("No se pudieron cargar los proveedores.");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      companyName: row.company_name,
      rfc: row.rfc,
    }));
  }
}
