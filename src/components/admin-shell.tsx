"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import type { UserRole } from "@/core/domain/user";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/profile-actions";
import { HomeIcon, CubeIcon, ArrowsRightLeftIcon, DocumentIcon, BuildingOfficeIcon, MapPinIcon, ChartBarIcon, UserGroupIcon, Cog6ToothIcon, UserIcon } from "@heroicons/react/24/outline";

type AdminShellProps = {
  role: UserRole | null;
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  roles?: UserRole[];
  icon: JSX.Element;
};

type UserInfo = {
  fullName: string;
  email: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <HomeIcon className="h-4 w-4" /> }, // TODOS
  { label: "Inventario Actual", href: "/inventory", roles: ["admin", "operador", "auditor"], icon: <CubeIcon className="h-4 w-4" /> },
  { label: "Movimientos", href: "/movements", roles: ["admin", "operador", "auditor"], icon: <ArrowsRightLeftIcon className="h-4 w-4" /> },
  { label: "Registrar Producto", href: "/products/new", roles: ["admin", "operador"], icon: <DocumentIcon className="h-4 w-4" /> },
  { label: "Proveedores", href: "/suppliers", roles: ["admin"], icon: <BuildingOfficeIcon className="h-4 w-4" /> },
  { label: "Ubicaciones", href: "/locations", roles: ["admin", "operador"], icon: <MapPinIcon className="h-4 w-4" /> },
  { label: "Reportes", href: "/reports", roles: ["admin", "auditor"], icon: <ChartBarIcon className="h-4 w-4" /> },
  { label: "Usuarios y Roles", href: "/admin/users", roles: ["admin"], icon: <UserGroupIcon className="h-4 w-4" /> },
  { label: "Configuración", href: "/admin/settings", roles: ["admin"], icon: <Cog6ToothIcon className="h-4 w-4" /> },
  { label: "Perfil", href: "/profile", icon: <UserIcon className="h-4 w-4" /> },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

export function AdminShell({ role, children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (user) {
        let fullName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email ||
          "User";

        // Try to read user_profiles for full_name if present
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (userProfile?.full_name) {
          fullName = userProfile.full_name;
        }

        setUserInfo({
          fullName,
          email: user.email ?? "sin-email",
        });
      }
    });
  }, []);

  const filteredNav = useMemo(() => {
    return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role ?? "auditor"));
  }, [role]);

  const initials = userInfo ? getInitials(userInfo.fullName) : "?";

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </Button>
          <div className="text-lg font-semibold text-zinc-900">Warehouse</div>
          {role && <Badge variant="outline">{role}</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {userInfo && (
            <>
              <div className="hidden text-right text-sm sm:block">
                <div className="font-semibold text-zinc-900">{userInfo.fullName}</div>
                <div className="text-xs text-zinc-500">{userInfo.email}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                {initials}
              </div>
              <form action={signOutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  Cerrar sesión
                </Button>
              </form>
            </>
          )}
        </div>
      </header>

      <div className="flex">
        <aside className="hidden min-h-screen w-64 shrink-0 border-r border-zinc-200 bg-white/90 p-4 backdrop-blur md:block">
          <nav className="flex flex-col gap-2">
            {filteredNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                <span className="mr-2 inline-flex items-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="w-full px-4 py-6 md:px-8">{children}</main>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold">Menú</div>
              <Button size="sm" variant="ghost" onClick={() => setIsSidebarOpen(false)}>
                ✕
              </Button>
            </div>
            <nav className="flex flex-col gap-2">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="mr-2 inline-flex items-center">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
