"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createSupplierAction,
  deleteSupplierAction,
  updateSupplierAction,
} from "@/app/actions/supplier-actions";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import type { UserRole } from "@/core/domain/user";

type SuppliersClientProps = {
  role: string | null;
};

const supplierSchema = z.object({
  companyName: z.string().trim().min(1, "Nombre de empresa requerido"),
  rfc: z
    .string()
    .trim()
    .min(12, "RFC mínimo 12 caracteres")
    .max(13, "RFC máximo 13 caracteres")
    .regex(/^[A-Za-z0-9]+$/, "Solo letras y números"),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  paymentTerms: z.string().trim().optional().default("Net 30"),
  deliveryTimeDays: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || !Number.isNaN(Number(val)), "Debe ser número")
    .refine((val) => !val || Number(val) >= 0, "Debe ser mayor o igual a 0")
    .default("7"),
  addressStreet: z.string().trim().optional(),
  addressCity: z.string().trim().optional(),
  addressState: z.string().trim().optional(),
  addressZipCode: z.string().trim().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

type SupplierRow = {
  id: string;
  company_name: string;
  rfc: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  payment_terms: string | null;
  delivery_time_days: number | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  is_active: boolean | null;
};

export default function SuppliersClient({ role }: SuppliersClientProps) {
  const [state, action, pending] = useActionState(createSupplierAction, { success: false, message: "" });
  const [updateState, updateAction, updatePending] = useActionState(updateSupplierAction, {
    success: false,
    message: "",
  });
  const { toast } = useToast();
  const [closingAfterUpdate, setClosingAfterUpdate] = useState(false);
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      companyName: "",
      rfc: "",
      email: "",
      phone: "",
      contactPerson: "",
      paymentTerms: "Net 30",
      deliveryTimeDays: "7",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressZipCode: "",
    },
  });
  const editForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
  });
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState<SupplierRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const loadSuppliers = useCallback(
    async (targetPage: number) => {
      setListLoading(true);
      setListError(null);
      const from = (targetPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("suppliers")
        .select("*", { count: "exact" })
        .order("company_name", { ascending: true })
        .range(from, to);

      if (error) {
        setListError(error.message);
        setList([]);
        setTotal(0);
      } else {
        setList((data as SupplierRow[]) ?? []);
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
    if (state.success) {
      form.reset();
      startTransition(() => {
        setPage(1);
        void loadSuppliers(1);
      });
    }
  }, [state.success, form, loadSuppliers]);

  useEffect(() => {
    startTransition(() => {
      void loadSuppliers(page);
    });
  }, [loadSuppliers, page]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("companyName", values.companyName);
    formData.append("rfc", values.rfc);
    formData.append("email", values.email ?? "");
    formData.append("phone", values.phone ?? "");
    formData.append("contactPerson", values.contactPerson ?? "");
    formData.append("paymentTerms", values.paymentTerms ?? "");
    formData.append("deliveryTimeDays", values.deliveryTimeDays ?? "");
    formData.append("addressStreet", values.addressStreet ?? "");
    formData.append("addressCity", values.addressCity ?? "");
    formData.append("addressState", values.addressState ?? "");
    formData.append("addressZipCode", values.addressZipCode ?? "");

    startTransition(() => {
      action(formData);
    });
  });

  const onUpdate = editForm.handleSubmit((values) => {
    if (!editing) return;
    const formData = new FormData();
    formData.append("id", editing.id);
    formData.append("companyName", values.companyName);
    formData.append("rfc", values.rfc);
    formData.append("email", values.email ?? "");
    formData.append("phone", values.phone ?? "");
    formData.append("contactPerson", values.contactPerson ?? "");
    formData.append("paymentTerms", values.paymentTerms ?? "");
    formData.append("deliveryTimeDays", values.deliveryTimeDays ?? "");
    formData.append("addressStreet", values.addressStreet ?? "");
    formData.append("addressCity", values.addressCity ?? "");
    formData.append("addressState", values.addressState ?? "");
    formData.append("addressZipCode", values.addressZipCode ?? "");
    formData.append("isActive", (editing.is_active ?? true).toString());

    startTransition(() => {
      setClosingAfterUpdate(true);
      updateAction(formData);
    });
  });

  useEffect(() => {
    if (editing) {
      editForm.reset({
        companyName: editing.company_name,
        rfc: editing.rfc,
        email: editing.email ?? "",
        phone: editing.phone ?? "",
        contactPerson: editing.contact_person ?? "",
        paymentTerms: editing.payment_terms ?? "Net 30",
        deliveryTimeDays: editing.delivery_time_days?.toString() ?? "7",
        addressStreet: editing.address_street ?? "",
        addressCity: editing.address_city ?? "",
        addressState: editing.address_state ?? "",
        addressZipCode: editing.address_zip_code ?? "",
      });
    }
  }, [editing, editForm]);

  useEffect(() => {
    if (closingAfterUpdate && updateState.success) {
      startTransition(() => {
        setEditing(null);
        setClosingAfterUpdate(false);
        void loadSuppliers(page);
      });
    }
  }, [closingAfterUpdate, updateState.success, loadSuppliers, page]);

  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    startDeleteTransition(async () => {
      const res = await deleteSupplierAction(formData);
      toast({
        title: res?.success ? "Listo" : "Error",
        description: res?.message ?? "",
      });
      if (res?.success) {
        loadSuppliers(page);
      }
    });
  };

  return (
    <AdminShell role={role as UserRole | null}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Proveedores</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Registrar proveedor</h1>
          <p className="text-sm text-zinc-600">RFC, contacto y términos de pago.</p>
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Datos del proveedor</CardTitle>
            <CardDescription>Información mínima para dar de alta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} onReset={() => form.reset()} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="companyName">Empresa</Label>
                <Input id="companyName" placeholder="Razón social" {...form.register("companyName")} />
                {form.formState.errors.companyName && (
                  <p className="text-xs text-red-600">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="rfc">RFC</Label>
                <Input id="rfc" placeholder="RFC" {...form.register("rfc")} />
                {form.formState.errors.rfc && (
                  <p className="text-xs text-red-600">{form.formState.errors.rfc.message}</p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="correo@empresa.com" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" placeholder="+52 55..." {...form.register("phone")} />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="contactPerson">Contacto</Label>
                  <Input id="contactPerson" placeholder="Nombre del contacto" {...form.register("contactPerson")} />
                  {form.formState.errors.contactPerson && (
                    <p className="text-xs text-red-600">{form.formState.errors.contactPerson.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="paymentTerms">Términos de pago</Label>
                  <Input id="paymentTerms" placeholder="Ej: 30 días" {...form.register("paymentTerms")} />
                  {form.formState.errors.paymentTerms && (
                    <p className="text-xs text-red-600">{form.formState.errors.paymentTerms.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="deliveryTimeDays">Tiempo de entrega (días)</Label>
                  <Input
                    id="deliveryTimeDays"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ej: 5"
                    {...form.register("deliveryTimeDays")}
                  />
                  {form.formState.errors.deliveryTimeDays && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.deliveryTimeDays.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addressStreet">Calle y número</Label>
                  <Input
                    id="addressStreet"
                    placeholder="Calle, número"
                    {...form.register("addressStreet")}
                  />
                  {form.formState.errors.addressStreet && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.addressStreet.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="addressCity">Ciudad</Label>
                  <Input id="addressCity" placeholder="Ciudad" {...form.register("addressCity")} />
                  {form.formState.errors.addressCity && (
                    <p className="text-xs text-red-600">{form.formState.errors.addressCity.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addressState">Estado</Label>
                  <Input id="addressState" placeholder="Estado" {...form.register("addressState")} />
                  {form.formState.errors.addressState && (
                    <p className="text-xs text-red-600">{form.formState.errors.addressState.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addressZipCode">CP</Label>
                  <Input id="addressZipCode" placeholder="Código Postal" {...form.register("addressZipCode")} />
                  {form.formState.errors.addressZipCode && (
                    <p className="text-xs text-red-600">{form.formState.errors.addressZipCode.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="reset" variant="ghost">
                  Limpiar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando..." : "Guardar proveedor"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Proveedores</CardTitle>
            <CardDescription>
              Lista paginada (ordenada por nombre). {total} total.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {listLoading ? (
              <p className="text-sm text-zinc-500">Cargando...</p>
            ) : listError ? (
              <p className="text-sm text-red-600">Error: {listError}</p>
            ) : list.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay proveedores.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>RFC</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.company_name}</TableCell>
                        <TableCell>{item.rfc}</TableCell>
                        <TableCell>{item.contact_person ?? "—"}</TableCell>
                        <TableCell>{item.email ?? "—"}</TableCell>
                        <TableCell>{item.phone ?? "—"}</TableCell>
                        <TableCell>{item.is_active ? "Activo" : "Inactivo"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditing(item)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => handleDelete(item.id)}
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
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold">Editar proveedor</h3>
                  <p className="text-sm text-zinc-500">{editing.company_name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  ✕
                </Button>
              </div>
              <form onSubmit={onUpdate} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-companyName">Empresa</Label>
                  <Input id="edit-companyName" {...editForm.register("companyName")} />
                  {editForm.formState.errors.companyName && (
                    <p className="text-xs text-red-600">
                      {editForm.formState.errors.companyName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-rfc">RFC</Label>
                  <Input id="edit-rfc" {...editForm.register("rfc")} />
                  {editForm.formState.errors.rfc && (
                    <p className="text-xs text-red-600">{editForm.formState.errors.rfc.message}</p>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" {...editForm.register("email")} />
                    {editForm.formState.errors.email && (
                      <p className="text-xs text-red-600">{editForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-phone">Teléfono</Label>
                    <Input id="edit-phone" {...editForm.register("phone")} />
                    {editForm.formState.errors.phone && (
                      <p className="text-xs text-red-600">{editForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-contactPerson">Contacto</Label>
                    <Input id="edit-contactPerson" {...editForm.register("contactPerson")} />
                    {editForm.formState.errors.contactPerson && (
                      <p className="text-xs text-red-600">
                        {editForm.formState.errors.contactPerson.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-paymentTerms">Términos de pago</Label>
                    <Input id="edit-paymentTerms" {...editForm.register("paymentTerms")} />
                    {editForm.formState.errors.paymentTerms && (
                      <p className="text-xs text-red-600">
                        {editForm.formState.errors.paymentTerms.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-deliveryTimeDays">Tiempo de entrega (días)</Label>
                    <Input
                      id="edit-deliveryTimeDays"
                      type="number"
                      min="0"
                      step="1"
                      {...editForm.register("deliveryTimeDays")}
                    />
                    {editForm.formState.errors.deliveryTimeDays && (
                      <p className="text-xs text-red-600">
                        {editForm.formState.errors.deliveryTimeDays.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-addressStreet">Calle y número</Label>
                    <Input id="edit-addressStreet" {...editForm.register("addressStreet")} />
                    {editForm.formState.errors.addressStreet && (
                      <p className="text-xs text-red-600">
                        {editForm.formState.errors.addressStreet.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-addressCity">Ciudad</Label>
                    <Input id="edit-addressCity" {...editForm.register("addressCity")} />
                    {editForm.formState.errors.addressCity && (
                      <p className="text-xs text-red-600">
                        {editForm.formState.errors.addressCity.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-addressState">Estado</Label>
                    <Input id="edit-addressState" {...editForm.register("addressState")} />
                    {editForm.formState.errors.addressState && (
                      <p className="text-xs text-red-600">
                        {editForm.formState.errors.addressState.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-addressZipCode">CP</Label>
                    <Input id="edit-addressZipCode" {...editForm.register("addressZipCode")} />
                    {editForm.formState.errors.addressZipCode && (
                      <p className="text-xs text-red-600">
                        {editForm.formState.errors.addressZipCode.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="edit-isActive"
                    type="checkbox"
                    checked={editing.is_active ?? true}
                    onChange={(e) =>
                      setEditing((prev) => (prev ? { ...prev, is_active: e.target.checked } : prev))
                    }
                    className="h-4 w-4 rounded border border-zinc-300 text-black focus:ring-2 focus:ring-black/50 focus:ring-offset-2"
                  />
                  <Label htmlFor="edit-isActive">Activo</Label>
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
