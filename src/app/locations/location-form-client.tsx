"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  createLocationAction,
  deleteLocationAction,
  updateLocationAction,
} from "@/app/actions/location-actions";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import type { UserRole } from "@/core/domain/user";

type LocationFormClientProps = {
  role: string | null;
};

export default function LocationFormClient({ role }: LocationFormClientProps) {
  const [state, action, pending] = useActionState(createLocationAction, { success: false, message: "" });
  const [updateState, updateAction, updatePending] = useActionState(updateLocationAction, {
    success: false,
    message: "",
  });
  const { toast } = useToast();
  const formSchema = z.object({
    code: z.string().trim().min(1, "El código es requerido"),
    type: z.string().trim().optional(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "", type: "" },
  });
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const supabase = useMemo(() => createClient(), []);
  const [locations, setLocations] = useState<
    Array<{ id: string; code: string; type: string | null }>
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; code: string; type: string | null } | null>(
    null
  );
  const [closingAfterUpdate, setClosingAfterUpdate] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const loadLocations = useCallback(
    async (targetPage: number) => {
      setListLoading(true);
      setListError(null);
      const from = (targetPage - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("locations")
        .select("id, code, type", { count: "exact" })
        .order("code", { ascending: true })
        .range(from, to);

      if (error) {
        setListError(error.message);
        setLocations([]);
        setTotal(0);
      } else {
        setLocations(
          (data as Array<{ id: string; code: string; type: string | null }> | null) ?? []
        );
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
      void loadLocations(page);
    });
  }, [loadLocations, page]);

  useEffect(() => {
    if (state.success) {
      form.reset();
      startTransition(() => {
        setPage(1);
        void loadLocations(1);
      });
    }
  }, [state.success, form, loadLocations]);

  useEffect(() => {
    if (editing) {
      editForm.reset({
        code: editing.code,
        type: editing.type ?? "",
      });
    }
  }, [editing, editForm]);

  useEffect(() => {
    if (closingAfterUpdate && updateState.success) {
      startTransition(() => {
        setEditing(null);
        setClosingAfterUpdate(false);
        void loadLocations(page);
      });
    }
  }, [closingAfterUpdate, updateState.success, loadLocations, page]);

  return (
    <AdminShell role={role as UserRole | null}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Ubicaciones</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Registrar ubicación</h1>
          <p className="text-sm text-zinc-600">Agregar códigos de racks, pasillos o zonas.</p>
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Nueva ubicación</CardTitle>
            <CardDescription>Define código y tipo (rack, floor, dock, quarantine).</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={form.handleSubmit((values) => {
                const formData = new FormData();
                formData.append("code", values.code);
                formData.append("type", values.type ?? "");
                startTransition(() => {
                  action(formData);
                });
              })}
              onReset={() => form.reset()}
            >
              <div className="space-y-1">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  placeholder="A-01-01"
                  autoComplete="off"
                  {...form.register("code")}
                />
                {form.formState.errors.code && (
                  <p className="text-xs text-red-600">{form.formState.errors.code.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/50 focus:ring-offset-2"
                  defaultValue=""
                  {...form.register("type")}
                >
                  <option value="" disabled>
                    Selecciona tipo
                  </option>
                  <option value="rack">Rack</option>
                  <option value="floor">Floor</option>
                  <option value="dock">Dock</option>
                  <option value="quarantine">Quarantine</option>
                </select>
                {form.formState.errors.type && (
                  <p className="text-xs text-red-600">{form.formState.errors.type.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
                {pending ? "Guardando..." : "Guardar ubicación"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Ubicaciones registradas</CardTitle>
            <CardDescription>Lista paginada (ordenada por código). {total} total.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {listLoading ? (
              <p className="text-sm text-zinc-500">Cargando...</p>
            ) : listError ? (
              <p className="text-sm text-red-600">Error: {listError}</p>
            ) : locations.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay ubicaciones.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-semibold">{loc.code}</TableCell>
                        <TableCell>{loc.type ?? "—"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditing(loc)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => {
                              const fd = new FormData();
                              fd.append("id", loc.id);
                              startDeleteTransition(async () => {
                                const res = await deleteLocationAction(fd);
                                toast({
                                  title: res?.success ? "Listo" : "Error",
                                  description: res?.message ?? "",
                                });
                                if (res?.success) {
                                  void loadLocations(page);
                                }
                              });
                            }}
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
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Editar ubicación</h3>
                  <p className="text-sm text-zinc-500">{editing.code}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  ✕
                </Button>
              </div>
              <form
                className="space-y-3"
                onSubmit={editForm.handleSubmit((values) => {
                  if (!editing) return;
                  const fd = new FormData();
                  fd.append("id", editing.id);
                  fd.append("code", values.code);
                  fd.append("type", values.type ?? "");
                  startTransition(() => {
                    setClosingAfterUpdate(true);
                    updateAction(fd);
                  });
                })}
              >
                <div className="space-y-1">
                  <Label htmlFor="edit-code">Código</Label>
                  <Input id="edit-code" {...editForm.register("code")} />
                  {editForm.formState.errors.code && (
                    <p className="text-xs text-red-600">{editForm.formState.errors.code.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-type">Tipo</Label>
                  <select
                    id="edit-type"
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/50 focus:ring-offset-2"
                    defaultValue={editing.type ?? ""}
                    {...editForm.register("type")}
                  >
                    <option value="">Selecciona tipo</option>
                    <option value="rack">Rack</option>
                    <option value="floor">Floor</option>
                    <option value="dock">Dock</option>
                    <option value="quarantine">Quarantine</option>
                  </select>
                  {editForm.formState.errors.type && (
                    <p className="text-xs text-red-600">{editForm.formState.errors.type.message}</p>
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
