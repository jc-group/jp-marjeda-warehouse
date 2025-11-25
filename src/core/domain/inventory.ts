export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl?: string;
  manufacturerPartNumber?: string | null;
  supplierId?: string | null;
  taxRate?: number | null;
  minStock?: number | null;
  originalCostPrice?: number | null;
  originalCurrencyCode?: string | null;
  currentMxnCost?: number | null;
}

export interface InventoryItem {
  id: string;
  product: Product;
  location: {
    id: string;
    code: string;
  };
  quantity: number;
}
