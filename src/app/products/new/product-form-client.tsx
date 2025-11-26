"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/app/actions/product-actions";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/types/supabase";
import type { UserRole } from "@/core/domain/user";

type ProductFormClientProps = {
  role: string | null;
  locations: Array<{ id: string; code: string; type?: string }>;
  suppliers: Array<{ id: string; companyName: string; rfc: string }>;
};

const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU requerido"),
  name: z.string().trim().min(1, "Nombre requerido"),
  description: z.string().trim().optional(),
  originalCostPrice: z.coerce.number().positive("Costo debe ser mayor a 0"),
  originalCurrencyCode: z.enum(["MXN", "USD"]),
  minStock: z.coerce.number().min(0, "Stock mínimo no puede ser negativo").default(0),
  taxRate: z.coerce.number().min(0, "IVA inválido").default(0.16),
  location: z.string().trim().optional(),
  initialQuantity: z.coerce.number().int().min(0, "Cantidad no puede ser negativa").default(0),
  supplierId: z.string().trim().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const editProductSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido"),
  description: z.string().trim().optional(),
  minStock: z.coerce.number().min(0, "Stock mínimo no puede ser negativo").default(0),
  taxRate: z.coerce.number().min(0, "IVA inválido").default(0.16),
  supplierId: z.string().trim().optional(),
});

type EditProductValues = z.infer<typeof editProductSchema>;

type ProductRow = Tables<"products"> & { suppliers?: Tables<"suppliers"> | null };

export default function ProductFormClient({ role, locations, suppliers }: ProductFormClientProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, action, pending] = useActionState(createProductAction, { success: false, message: "" });
  const [updateState, updateAction, updatePending] = useActionState(updateProductAction, {
    success: false,
    message: "",
  });
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [closingAfterUpdate, setClosingAfterUpdate] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      originalCostPrice: 0,
      originalCurrencyCode: "MXN",
      minStock: 0,
      taxRate: 0.16,
      location: "",
      initialQuantity: 0,
      supplierId: "",
    },
  });

  const editForm = useForm<EditProductValues>({
    resolver: zodResolver(editProductSchema),
  });

  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach((s) => map.set(s.id, s.companyName));
    return map;
  }, [suppliers]);

  const loadProducts = useCallback(
    async (targetPage: number) => {
      setListLoading(true);
      setListError(null);
      const from = (targetPage - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("products")
        .select("*, suppliers (*)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        setListError(error.message);
        setProducts([]);
        setTotal(0);
      } else {
        setProducts((data as ProductRow[]) ?? []);
        setTotal(count ?? 0);
      }
      setListLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Listo" : "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  useEffect(() => {
    if (updateState.message) {
      toast({
        title: updateState.success ? "Listo" : "Error",
        description: updateState.message,
      });
    }
  }, [updateState, toast]);

  useEffect(() => {
    startTransition(() => {
      void loadProducts(page);
    });
  }, [loadProducts, page]);

  useEffect(() => {
    if (state.success) {
      startTransition(() => {
        setPage(1);
        void loadProducts(1);
      });
    }
  }, [state.success, loadProducts]);

  useEffect(() => {
    if (editing) {
      editForm.reset({
        name: editing.name,
        description: editing.description ?? "",
        minStock: editing.min_stock ?? 0,
        taxRate: editing.tax_rate ?? 0.16,
        supplierId: editing.supplier_id ?? "",
      });
    }
  }, [editing, editForm]);

  useEffect(() => {
    if (closingAfterUpdate && updateState.success) {
      startTransition(() => {
        setEditing(null);
        setClosingAfterUpdate(false);
        void loadProducts(page);
      });
    }
  }, [closingAfterUpdate, updateState.success, loadProducts, page]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("sku", values.sku);
    formData.append("name", values.name);
    formData.append("description", values.description ?? "");
    formData.append("originalCostPrice", String(values.originalCostPrice));
    formData.append("originalCurrencyCode", values.originalCurrencyCode);
    formData.append("minStock", String(values.minStock ?? 0));
    formData.append("taxRate", String(values.taxRate ?? 0.16));
    formData.append("location", values.location ?? "");
    formData.append("initialQuantity", String(values.initialQuantity ?? 0));
    if (values.supplierId) {
      formData.append("supplierId", values.supplierId);
    }
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    startTransition(() => {
      action(formData);
    });
  });

  const onUpdate = editForm.handleSubmit((values) => {
    if (!editing) return;
    const formData = new FormData();
    formData.append("id", editing.id);
    formData.append("name", values.name);
    formData.append("description", values.description ?? "");
    formData.append("minStock", String(values.minStock ?? 0));
    formData.append("taxRate", String(values.taxRate ?? 0.16));
    if (values.supplierId) {
      formData.append("supplierId", values.supplierId);
    }
    startTransition(() => {
      setClosingAfterUpdate(true);
      updateAction(formData);
    });
  });

  const handleDelete = (id: string) => {
    const fd = new FormData();
    fd.append("id", id);
    startDeleteTransition(async () => {
      const res = await deleteProductAction(fd);
      toast({
        title: res?.success ? "Listo" : "Error",
        description: res?.message ?? "",
      });
      if (res?.success) {
        loadProducts(page);
      }
    });
  };

  return (
    <AdminShell role={role as UserRole | null}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Productos</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Registrar producto</h1>
          <p className="text-sm text-zinc-600">SKU, nombre, descripción, imagen y ubicación inicial.</p>
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Ficha maestra</CardTitle>
            <CardDescription>Datos básicos del SKU.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onSubmit}
              onReset={() => {
                form.reset();
                setPreviewUrl(null);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="Ej: FIL-001"
                  {...form.register("sku")}
                  autoComplete="off"
                />
                {form.formState.errors.sku && (
                  <p className="text-xs text-red-600">{form.formState.errors.sku.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Filtro de aceite"
                  {...form.register("name")}
                  autoComplete="off"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Opcional"
                  {...form.register("description")}
                  autoComplete="off"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-600">{form.formState.errors.description.message}</p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="originalCostPrice">Costo original (factura proveedor)</Label>
                  <Input
                    id="originalCostPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 25.50"
                    {...form.register("originalCostPrice")}
                  />
                  {form.formState.errors.originalCostPrice && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.originalCostPrice.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="originalCurrencyCode">Divisa de origen</Label>
                  <select
                    id="originalCurrencyCode"
                    className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2"
                    {...form.register("originalCurrencyCode")}
                  >
                    <option value="MXN">MXN - Peso mexicano</option>
                    <option value="USD">USD - Dólar estadounidense</option>
                  </select>
                  {form.formState.errors.originalCurrencyCode && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.originalCurrencyCode.message}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500">
                    La conversión a MXN se calcula automáticamente en el caso de uso.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="minStock">Stock mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    {...form.register("minStock")}
                  />
                  {form.formState.errors.minStock && (
                    <p className="text-xs text-red-600">{form.formState.errors.minStock.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="taxRate">Tasa IVA</Label>
                  <Input id="taxRate" type="number" step="0.01" {...form.register("taxRate")} />
                  {form.formState.errors.taxRate && (
                    <p className="text-xs text-red-600">{form.formState.errors.taxRate.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="location">Ubicación inicial (opcional)</Label>
                <Input
                  id="location"
                  placeholder="Ej: A-01-01"
                  {...form.register("location")}
                  list="location-list"
                  autoComplete="off"
                />
                <datalist id="location-list">
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.code}>
                      {loc.code} {loc.type ? `(${loc.type})` : ""}
                    </option>
                  ))}
                </datalist>
                <p className="text-xs text-zinc-500">Empieza a escribir para autocompletar.</p>
                {form.formState.errors.location && (
                  <p className="text-xs text-red-600">{form.formState.errors.location.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="initialQuantity">Cantidad inicial (opcional)</Label>
                <Input
                  id="initialQuantity"
                  type="number"
                  min="0"
                  {...form.register("initialQuantity")}
                />
                {form.formState.errors.initialQuantity && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.initialQuantity.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="supplierId">Proveedor (opcional)</Label>
                <Input
                  id="supplierId"
                  placeholder="Busca y selecciona proveedor"
                  {...form.register("supplierId")}
                  list="supplier-list"
                  autoComplete="off"
                />
                <datalist id="supplier-list">
                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                      label={`${supplier.companyName} (${supplier.rfc})`}
                    >
                      {supplier.companyName}
                    </option>
                  ))}
                </datalist>
                <p className="text-xs text-zinc-500">
                  Escribe para filtrar y selecciona el proveedor; se enviará su ID.
                </p>
                {form.formState.errors.supplierId && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.supplierId.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="image">Foto o imagen</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    aria-label="Subir foto o imagen"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file) {
                        setSelectedFile(file);
                        const url = URL.createObjectURL(file);
                        setPreviewUrl(url);
                      } else {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }
                    }}
                  />
                  <label
                    htmlFor="image"
                    className="inline-flex w-fit cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
                  >
                    Seleccionar archivo
                  </label>
                </div>
                {previewUrl && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    <img src={previewUrl} alt="Vista previa" className="h-32 w-full object-cover" />
                  </div>
                )}
                <p className="text-xs text-zinc-500">
                  Sube o toma una foto; si no adjuntas nada usaremos la imagen por defecto.
                </p>
              </div>

              <div className="flex items-center justify-end">
                <Button type="submit" variant="secondary" className="w-full sm:w-auto" disabled={pending}>
                  {pending ? "Guardando..." : "Guardar producto"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>Lista paginada, ordenada por más recientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {listLoading ? (
              <p className="text-sm text-zinc-500">Cargando...</p>
            ) : listError ? (
              <p className="text-sm text-red-600">Error: {listError}</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay productos.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Stock mínimo</TableHead>
                      <TableHead>IVA</TableHead>
                      <TableHead>Precio MXN</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-semibold">{product.sku}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{supplierMap.get(product.supplier_id ?? "") ?? "—"}</TableCell>
                        <TableCell>{product.min_stock ?? 0}</TableCell>
                        <TableCell>{product.tax_rate ?? 0}</TableCell>
                        <TableCell>{product.current_mxn_cost?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditing(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => handleDelete(product.id)}
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span>
                Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || listLoading}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const maxPage = Math.max(1, Math.ceil(total / pageSize));
                    setPage((p) => Math.min(maxPage, p + 1));
                  }}
                  disabled={page >= Math.ceil(total / pageSize) || listLoading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold">Editar producto</h3>
                  <p className="text-sm text-zinc-500">{editing.sku}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  ✕
                </Button>
              </div>
              <form onSubmit={onUpdate} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input id="edit-name" {...editForm.register("name")} />
                  {editForm.formState.errors.name && (
                    <p className="text-xs text-red-600">{editForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Input id="edit-description" {...editForm.register("description")} />
                  {editForm.formState.errors.description && (
                    <p className="text-xs text-red-600">
                      {editForm.formState.errors.description.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-minStock">Stock mínimo</Label>
                    <Input id="edit-minStock" type="number" min="0" {...editForm.register("minStock")} />
                    {editForm.formState.errors.minStock && (
                      <p className="text-xs text-red-600">{editForm.formState.errors.minStock.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-taxRate">IVA</Label>
                    <Input id="edit-taxRate" type="number" step="0.01" {...editForm.register("taxRate")} />
                    {editForm.formState.errors.taxRate && (
                      <p className="text-xs text-red-600">{editForm.formState.errors.taxRate.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-supplierId">Proveedor</Label>
                  <Input
                    id="edit-supplierId"
                    list="supplier-list"
                    placeholder="Selecciona proveedor"
                    autoComplete="off"
                    {...editForm.register("supplierId")}
                  />
                  <datalist id="supplier-list">
                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                        label={`${supplier.companyName} (${supplier.rfc})`}
                      >
                        {supplier.companyName}
                      </option>
                    ))}
                  </datalist>
                  {editForm.formState.errors.supplierId && (
                    <p className="text-xs text-red-600">
                      {editForm.formState.errors.supplierId.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updatePending}>
                    {updatePending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
