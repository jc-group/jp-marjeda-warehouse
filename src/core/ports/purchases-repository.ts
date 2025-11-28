import {
  CurrencyCode,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  PurchaseRequestApproval,
  PurchaseRequestItem,
  PurchaseRequestStatus,
  PurchasePriority,
  UserProfile,
} from "../domain/purchase";
import type { Supplier } from "../domain/supplier";

export interface PurchasesRepository {
  generateNextRequestNumber(): Promise<string>;
  generateNextPONumber(): Promise<string>;

  createPurchaseRequest(input: {
    requestNumber: string;
    requesterId: string;
    supplierId?: string | null;
    priority: PurchasePriority;
    currencyCode: CurrencyCode;
    requiredDate?: string | null;
    notes?: string | null;
    status: PurchaseRequestStatus;
    totalAmount: number;
  }): Promise<PurchaseRequest>;

  addPurchaseRequestItem(input: {
    purchaseRequestId: string;
    productId?: string | null;
    description: string;
    quantity: number;
    unitOfMeasure: string;
    unitPriceEstimated: number;
    currencyCode: CurrencyCode;
    lineTotal: number;
    neededDate?: string | null;
  }): Promise<PurchaseRequestItem>;

  recalculatePurchaseRequestTotal(purchaseRequestId: string): Promise<number>;

  updatePurchaseRequestStatus(id: string, status: PurchaseRequestStatus): Promise<PurchaseRequest>;

  getPurchaseRequestWithItems(id: string): Promise<{ request: PurchaseRequest; items: PurchaseRequestItem[] }>;

  createApproval(input: {
    purchaseRequestId: string;
    approverId: string;
    level?: number;
    status: "APPROVED" | "REJECTED";
    comments?: string | null;
  }): Promise<PurchaseRequestApproval>;

  createPurchaseOrderFromRequest(input: {
    request: PurchaseRequest;
    buyerId: string;
    poNumber: string;
    items: PurchaseRequestItem[];
  }): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] }>;

  listPurchaseRequestsForUser(user: UserProfile): Promise<PurchaseRequest[]>;
  listPurchaseOrders(): Promise<PurchaseOrder[]>;
  listActiveSuppliers(): Promise<Supplier[]>;
}
