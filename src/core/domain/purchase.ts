export type CurrencyCode = "MXN" | "USD" | "EUR" | (string & {});

export type PurchasePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type PurchaseRequestStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "CONVERTED_TO_PO";

export type PurchaseOrderStatus = "OPEN" | "PARTIALLY_RECEIVED" | "CLOSED" | "CANCELLED";

export type UserProfile = {
  id: string;
  role: "admin" | "operador" | "auditor";
  is_active: boolean;
  can_request_purchases: boolean;
  can_approve_purchases: boolean;
};

export type PurchaseRequest = {
  id: string;
  requestNumber: string;
  requesterId: string;
  supplierId?: string | null;
  priority: PurchasePriority;
  status: PurchaseRequestStatus;
  currencyCode: CurrencyCode;
  totalAmount: number;
  requiredDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PurchaseRequestItem = {
  id: string;
  purchaseRequestId: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPriceEstimated: number;
  currencyCode: CurrencyCode;
  lineTotal: number;
  neededDate?: string | null;
  createdAt?: string;
};

export type PurchaseRequestApproval = {
  id: string;
  purchaseRequestId: string;
  approverId: string;
  level: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decisionAt?: string | null;
  comments?: string | null;
  createdAt?: string;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  purchaseRequestId?: string | null;
  buyerId: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  currencyCode: CurrencyCode;
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PurchaseOrderItem = {
  id: string;
  purchaseOrderId: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  currencyCode: CurrencyCode;
  lineTotal: number;
  createdAt?: string;
};

export function can(user: UserProfile, action: "REQUEST_PURCHASE" | "APPROVE_PURCHASE"): boolean {
  if (user.role === "admin") return true;

  if (action === "REQUEST_PURCHASE") {
    return user.can_request_purchases === true;
  }

  if (action === "APPROVE_PURCHASE") {
    return user.can_approve_purchases === true;
  }

  return false;
}
