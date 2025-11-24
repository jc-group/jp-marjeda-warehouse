"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Procesando inicio de sesión...");

  useEffect(() => {
    const supabase = createClient();
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const next = params.get("next") ?? "/inventory";

    if (!access_token || !refresh_token) {
      setError("Token inválido o faltante en la URL.");
      setStatus("No se pudo recuperar la sesión.");
      return;
    }

    supabase.auth
      .setSession({
        access_token,
        refresh_token,
      })
      .then(({ error: setErrorResult }) => {
        if (setErrorResult) {
          setError(setErrorResult.message);
          setStatus("No se pudo establecer la sesión.");
        } else {
          setStatus("Sesión establecida, redirigiendo...");
          router.replace(next);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error inesperado");
        setStatus("No se pudo establecer la sesión.");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-3">
        <h1 className="text-xl font-semibold text-zinc-900">Confirmando acceso…</h1>
        <p className="text-sm text-zinc-600">{status}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
