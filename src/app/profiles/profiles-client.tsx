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

import { updateUserAction, deleteUserAction } from "@/app/actions/user-actions";
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

type ProfilesClientProps = {
  role: string | null;
};

type UserProfileRow = Tables<"user_profiles">;

const editSchema = z.object({
  full_name: z.string().trim().optional(),
  username: z.string().trim().optional(),
  role: z.enum(["admin", "operador", "auditor"]).default("operador"),
  is_active: z.boolean().default(true),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function ProfilesClient({ role }: ProfilesClientProps) {
  const [updateState, updateAction, updatePending] = useActionState(updateUserAction, {
    success: false,
    message: "",
  });
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [profiles, setProfiles] = useState<UserProfileRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserProfileRow | null>(null);
  const [closingAfterUpdate, setClosingAfterUpdate] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  const loadProfiles = useCallback(
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
        setProfiles([]);
        setTotal(0);
      } else {
        setProfiles((data as UserProfileRow[]) ?? []);
        setTotal(count ?? 0);
      }

      setListLoading(false);
    },
    [supabase]
  );

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
      void loadProfiles(page);
    });
  }, [loadProfiles, page]);

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
        void loadProfiles(page);
      });
    }
  }, [closingAfterUpdate, updateState.success, loadProfiles, page]);

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
        void loadProfiles(page);
      }
    });
  };

  return (
    <AdminShell role={role as UserRole | null}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Perfiles</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Gestión de perfiles</h1>
          <p className="text-sm text-zinc-600">Actualiza nombre, username, rol y estado.</p>
        </div>

        <Card className="border-zinc-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Perfiles de usuarios</CardTitle>
            <CardDescription>Lista paginada desde user_profiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {listLoading ? (
              <p className="text-sm text-zinc-500">Cargando...</p>
            ) : listError ? (
              <p className="text-sm text-red-600">Error: {listError}</p>
            ) : profiles.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay perfiles.</p>
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
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-semibold">{profile.full_name ?? "Sin nombre"}</TableCell>
                        <TableCell>{profile.username ?? "—"}</TableCell>
                        <TableCell className="uppercase">{profile.role}</TableCell>
                        <TableCell>{profile.is_active ? "Activo" : "Inactivo"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditing(profile)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => handleDelete(profile.id)}
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
                  <h3 className="text-xl font-semibold">Editar perfil</h3>
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
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
