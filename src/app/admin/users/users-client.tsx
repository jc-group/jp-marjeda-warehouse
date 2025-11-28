"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createUserAction,
  deleteUserAction,
  updateUserAction,
} from "@/app/actions/user-actions";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/infrastructure/supabase/types";
import type { UserRole } from "@/core/domain/user";

type UsersClientProps = {
  role: string | null;
};

const createSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Min 6 caracteres"),
  full_name: z.string().trim().optional(),
  role: z.enum(["admin", "operador", "auditor"]).default("operador"),
});

type CreateFormValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  full_name: z.string().trim().optional(),
  username: z.string().trim().optional(),
  role: z.enum(["admin", "operador", "auditor"]).default("operador"),
  is_active: z.boolean().default(true),
});

type EditFormValues = z.infer<typeof editSchema>;

type UserProfileRow = Tables<"user_profiles">;

export default function UsersClient({ role }: UsersClientProps) {
  const [state, createAction, createPending] = useActionState(createUserAction, {
    success: false,
    message: "",
  });
  const [updateState, updateAction, updatePending] = useActionState(updateUserAction, {
    success: false,
    message: "",
  });
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [users, setUsers] = useState<UserProfileRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserProfileRow | null>(null);
  const [closingAfterUpdate, setClosingAfterUpdate] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [adminUpdatePending, setAdminUpdatePending] = useState(false);
  const [adminUpdateMessage, setAdminUpdateMessage] = useState<string | null>(null);

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: "operador",
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  const loadUsers = useCallback(
    async (targetPage: number) => {
      setListLoading(true);
      setListError(null);
      const from = (targetPage - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        setListError(error.message);
        setUsers([]);
        setTotal(0);
      } else {
        setUsers((data as UserProfileRow[]) ?? []);
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
      void loadUsers(page);
    });
  }, [loadUsers, page]);

  useEffect(() => {
    if (state.success) {
      createForm.reset();
      startTransition(() => {
        setPage(1);
        void loadUsers(1);
      });
    }
  }, [state.success, createForm, loadUsers]);

  useEffect(() => {
    if (editing) {
      editForm.reset({
        full_name: editing.full_name ?? "",
        username: editing.username ?? "",
        role: (editing.role as EditFormValues["role"]) ?? "operador",
        is_active: editing.is_active ?? true,
      });
    }
  }, [editing, editForm]);

  useEffect(() => {
    if (closingAfterUpdate && updateState.success) {
      startTransition(() => {
        setEditing(null);
        setClosingAfterUpdate(false);
        void loadUsers(page);
      });
    }
  }, [closingAfterUpdate, updateState.success, loadUsers, page]);

  const onCreate = createForm.handleSubmit((values) => {
    const fd = new FormData();
    fd.append("email", values.email);
    fd.append("password", values.password);
    fd.append("full_name", values.full_name ?? "");
    fd.append("role", values.role);
    startTransition(() => {
      createAction(fd);
    });
  });

  const onUpdate = editForm.handleSubmit((values) => {
    if (!editing) return;
    const fd = new FormData();
    fd.append("id", editing.id);
    fd.append("full_name", values.full_name ?? "");
    fd.append("username", values.username ?? "");
    fd.append("role", values.role);
    fd.append("is_active", values.is_active ? "true" : "false");
    startTransition(() => {
      setClosingAfterUpdate(true);
      updateAction(fd);
    });
    // Opcional: actualizar metadata en auth para mantener sincronía
    handleAdminUpdate({
      id: editing.id,
      meta: {
        full_name: values.full_name ?? "",
        username: values.username ?? "",
        role: values.role,
        is_active: values.is_active,
      },
    });
  });

  const handleDelete = (id: string) => {
    const fd = new FormData();
    fd.append("id", id);
    startDeleteTransition(async () => {
      const res = await deleteUserAction(fd);
      toast({
        title: res?.success ? "Listo" : "Error",
        description: res?.message ?? "",
      });
      if (res?.success) {
        void loadUsers(page);
      }
    });
  };

  const handleAdminUpdate = async (payload: {
    id: string;
    email?: string;
    password?: string;
    meta?: Record<string, unknown>;
  }) => {
    if (!payload.email && !payload.password && !payload.meta) {
      setAdminUpdateMessage("Ingresa email, contraseña o metadata para actualizar.");
      return;
    }

    setAdminUpdatePending(true);
    setAdminUpdateMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email || undefined,
          password: payload.password || undefined,
          meta: payload.meta || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.details || data?.error || "No se pudo actualizar.";
        setAdminUpdateMessage(msg);
      } else {
        setAdminUpdateMessage("Actualizado correctamente en Auth.");
        void loadUsers(page);
      }
    } catch (err) {
      setAdminUpdateMessage(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setAdminUpdatePending(false);
    }
  };

  return (
    <AdminShell role={role as UserRole | null}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Usuarios y Roles</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Gestión de usuarios</h1>
          <p className="text-sm text-zinc-600">Crear, editar rol/estado y eliminar cuentas.</p>
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Nuevo usuario</CardTitle>
            <CardDescription>Crear en Supabase Auth y user_profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} onReset={() => createForm.reset()} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="correo@empresa.com" {...createForm.register("email")} />
                  {createForm.formState.errors.email && (
                    <p className="text-xs text-red-600">{createForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="••••••••" {...createForm.register("password")} />
                  {createForm.formState.errors.password && (
                    <p className="text-xs text-red-600">{createForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input id="full_name" placeholder="Nombre y Apellido" {...createForm.register("full_name")} />
                {createForm.formState.errors.full_name && (
                  <p className="text-xs text-red-600">{createForm.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/50 focus:ring-offset-2"
                  defaultValue="operador"
                  {...createForm.register("role")}
                >
                  <option value="admin">Admin</option>
                  <option value="operador">Operador</option>
                  <option value="auditor">Auditor</option>
                </select>
                {createForm.formState.errors.role && (
                  <p className="text-xs text-red-600">{createForm.formState.errors.role.message}</p>
                )}
              </div>

              <Button type="submit" disabled={createPending} className="w-full sm:w-auto">
                {createPending ? "Creando..." : "Crear usuario"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>Lista paginada, ordenada por creación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {listLoading ? (
              <p className="text-sm text-zinc-500">Cargando...</p>
            ) : listError ? (
              <p className="text-sm text-red-600">Error: {listError}</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay usuarios.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-semibold">{user.full_name ?? "Sin nombre"}</TableCell>
                        <TableCell>{user.username ?? "—"}</TableCell>
                        <TableCell className="uppercase">{user.role}</TableCell>
                        <TableCell>{user.is_active ? "Activo" : "Inactivo"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditing(user)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => handleDelete(user.id)}
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
                  <h3 className="text-xl font-semibold">Editar usuario</h3>
                  <p className="text-sm text-zinc-500">{editing.username ?? editing.id}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  ✕
                </Button>
              </div>
              <form onSubmit={onUpdate} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-full_name">Nombre completo</Label>
                  <Input id="edit-full_name" {...editForm.register("full_name")} />
                  {editForm.formState.errors.full_name && (
                    <p className="text-xs text-red-600">
                      {editForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input id="edit-username" {...editForm.register("username")} />
                  {editForm.formState.errors.username && (
                    <p className="text-xs text-red-600">
                      {editForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-role">Rol</Label>
                  <select
                    id="edit-role"
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/50 focus:ring-offset-2"
                    defaultValue={editing.role ?? "operador"}
                    {...editForm.register("role")}
                  >
                    <option value="admin">Admin</option>
                    <option value="operador">Operador</option>
                    <option value="auditor">Auditor</option>
                  </select>
                  {editForm.formState.errors.role && (
                    <p className="text-xs text-red-600">{editForm.formState.errors.role.message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="edit-is_active"
                    type="checkbox"
                    className="h-4 w-4 rounded border border-zinc-300 text-black focus:ring-2 focus:ring-black/50 focus:ring-offset-2"
                    checked={editForm.watch("is_active") ?? true}
                    onChange={(e) => editForm.setValue("is_active", e.target.checked)}
                  />
                  <Label htmlFor="edit-is_active">Activo</Label>
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

              <div className="mt-4 rounded-lg border border-zinc-200 p-3">
                <p className="text-sm font-semibold text-zinc-800">Actualizar Auth (email / password)</p>
                <p className="text-xs text-zinc-500">
                  Usa este bloque para cambiar email o contraseña en auth.users (requiere Service Role).
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="admin-email">Nuevo email</Label>
                    <Input id="admin-email" type="email" placeholder="correo@dominio.com" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="admin-password">Nueva contraseña</Label>
                    <Input id="admin-password" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={adminUpdatePending}
                    onClick={() => {
                      if (!editing) return;
                      const emailInput = (document.getElementById("admin-email") as HTMLInputElement | null)?.value;
                      const passwordInput = (
                        document.getElementById("admin-password") as HTMLInputElement | null
                      )?.value;
                      handleAdminUpdate({
                        id: editing.id,
                        email: emailInput || undefined,
                        password: passwordInput || undefined,
                      });
                    }}
                  >
                    {adminUpdatePending ? "Actualizando..." : "Actualizar Auth"}
                  </Button>
                </div>
                {adminUpdateMessage && (
                  <p
                    className={`mt-2 text-sm ${
                      adminUpdateMessage.toLowerCase().includes("error") ||
                      adminUpdateMessage.toLowerCase().includes("no se pudo")
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {adminUpdateMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
