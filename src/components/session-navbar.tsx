"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { createClient } from "@/utils/supabase/client";
import { Database } from "@/infrastructure/supabase/types";

type SessionState = {
  fullName: string;
  email: string;
  role: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

export function SessionNavbar() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);

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
        let role =
          (user.app_metadata?.role as string | undefined) ||
          (user.role as string | undefined) ||
          "authenticated";

        // Try to load user_profiles row to override role/full_name if present
        const { data: userRole } = await supabase
          .from("user_profiles" satisfies keyof Database["public"]["Tables"])
          .select("full_name, role")
          .eq("id", user.id)
          .single();

        if (userRole) {
          fullName = userRole.full_name ?? fullName;
          role = userRole.role ?? role;
        }

        setSession({
          fullName,
          email: user.email ?? "sin-email",
          role,
        });
      }
      setLoading(false);
    });
  }, []);

  const initials = useMemo(
    () => (session ? getInitials(session.fullName) : "?"),
    [session]
  );

  return (
    <nav className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase text-emerald-700">
          Logged in
        </span>
        <Link href="/inventory" className="text-zinc-600 hover:text-zinc-900">
          Inventario
        </Link>
      </div>

      {loading ? (
        <div className="h-10 w-36 animate-pulse rounded-lg bg-zinc-100" />
      ) : session ? (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-zinc-900">
              {session.fullName}
            </div>
            <div className="text-xs text-zinc-500">
              {session.email} · {session.role}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
            {initials}
          </div>
        </div>
      ) : (
        <Link
          href="/login"
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Login
        </Link>
      )}
    </nav>
  );
}
