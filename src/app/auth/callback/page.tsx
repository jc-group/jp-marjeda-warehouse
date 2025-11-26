"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Procesando inicio de sesión...");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/inventory");
  const [hasTokens, setHasTokens] = useState(false);
  const [flowType, setFlowType] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const hash = url.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const searchParams = url.searchParams;

    const access_token = hashParams.get("access_token") || searchParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token");
    const type = hashParams.get("type") || searchParams.get("type");
    const next =
      hashParams.get("next") ||
      searchParams.get("next") ||
      (type === "recovery" ? "/update-password" : "/inventory");
    const message =
      hashParams.get("message") || searchParams.get("message") || undefined;
    startTransition(() => setNextPath(next));
    startTransition(() => setFlowType(type ?? null));
    startTransition(() => {
      setInfoMessage(message ?? null);
    });

    if (!access_token || !refresh_token) {
      startTransition(() => {
        // Caso típico: se aceptó un link de confirmación sin tokens (p.ej. cambio de email).
        if (message) {
          setStatus(message);
          setError(null);
        } else {
          setError(null);
          setStatus("Redirigiendo...");
          router.replace(next || "/login");
        }
      });
      return;
    }

    startTransition(() => setHasTokens(true));
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
            const isSensitiveFlow = type === "recovery" || flowType === "email-change";
            if (isSensitiveFlow) {
              supabase.auth.signOut().finally(() => {
                setStatus("Sesión cerrada, inicia de nuevo.");
                router.replace("/login");
              });
            } else {
              setStatus("Sesión establecida, redirigiendo...");
              router.replace(next);
            }
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
        {infoMessage && <p className="text-sm text-zinc-600">{infoMessage}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!hasTokens && infoMessage && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
              onClick={() => router.replace(nextPath || "/profile")}
            >
              Confirmar
            </button>
            <button
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800"
              onClick={() => router.replace("/login")}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
