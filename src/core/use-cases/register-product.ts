import { Product } from "@/core/domain/inventory";

export interface RegisterProductParams {
  sku: string;
  name: string;
  description: string;
  minStock: number;
  taxRate: number;
  originalCostPrice: number;
  originalCurrencyCode: string;
  exchangeRate: number;
  manufacturerPartNumber?: string | null;
  supplierId?: string;
  imageFile?: File | string;
  initialQuantity?: number;
  initialLocationCode?: string;
  userId: string;
}

export interface ProductRepository {
  create(product: {
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
  }): Promise<Product>;
  uploadImage(file: File): Promise<string>;
}

export interface UserRoleRepository {
  getUserRole(userId?: string): Promise<string | null>;
}

export class RegisterProduct {
  constructor(
    private productRepo: ProductRepository,
    private userRepo: UserRoleRepository,
    private moveInventory: {
      execute(params: {
        sku: string;
        locationCode: string;
        quantity: number;
        type: "IN" | "OUT";
        userId: string;
      }): Promise<void>;
    }
  ) {}

  async execute(params: RegisterProductParams): Promise<Product> {
    const userRole = await this.userRepo.getUserRole(params.userId);
    if (userRole !== "admin" && userRole !== "operador") {
      throw new Error("Permiso denegado: se requiere rol de Admin u Operador para registrar productos.");
    }

    const normalizedCurrency = params.originalCurrencyCode?.toUpperCase();
    if (!normalizedCurrency) {
      throw new Error("La divisa de origen es obligatoria.");
    }

    const originalCostPrice = Number(params.originalCostPrice);
    if (Number.isNaN(originalCostPrice) || originalCostPrice < 0) {
      throw new Error("El costo original debe ser un número válido.");
    }

    const exchangeRate =
      normalizedCurrency === "MXN" ? 1 : Number(params.exchangeRate);
    if (Number.isNaN(exchangeRate) || exchangeRate <= 0) {
      throw new Error("La tasa de cambio es inválida.");
    }

    const currentMxnCost = originalCostPrice * exchangeRate;

    let imageUrl: string | undefined = undefined;
    if (params.imageFile instanceof File) {
      imageUrl = await this.productRepo.uploadImage(params.imageFile);
    } else if (typeof params.imageFile === "string" && params.imageFile) {
      imageUrl = params.imageFile;
    }

    const newProduct = await this.productRepo.create({
      sku: params.sku.toUpperCase(),
      name: params.name,
      description: params.description || null,
      image_url: imageUrl,
      min_stock: params.minStock ?? 0,
      manufacturer_part_number: params.manufacturerPartNumber ?? null,
      supplier_id: params.supplierId ?? null,
      tax_rate: params.taxRate ?? 0.16,
      original_cost_price: originalCostPrice,
      original_currency_code: normalizedCurrency,
      current_mxn_cost: currentMxnCost,
    });

    if (params.initialQuantity && params.initialQuantity > 0 && params.initialLocationCode) {
      await this.moveInventory.execute({
        sku: newProduct.sku,
        locationCode: params.initialLocationCode,
        quantity: params.initialQuantity,
        type: "IN",
        userId: params.userId,
      });
    }

    return newProduct;
  }
}
