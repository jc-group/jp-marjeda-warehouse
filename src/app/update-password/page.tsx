"use client";

import { startTransition, useEffect, useState } from "react";

import { updatePasswordAction } from "./actions";
import { createClient } from "@/utils/supabase/client";

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    try {
      await updatePasswordAction(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar contraseña");
      setPending(false);
    }
  };

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const message = params.get("message");
    if (message) {
      startTransition(() => setStatus(message));
    }
    if (access_token && refresh_token) {
      const supabase = createClient();
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error: err }) => {
          if (err) setError(err.message);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Error al recuperar sesión"));
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow border">
        <h2 className="text-xl font-bold mb-4">Bienvenido al Equipo</h2>
        <p className="text-sm text-gray-600 mb-6">
          Para activar tu cuenta, por favor establece una contraseña segura.
        </p>
        {status && <p className="mb-4 text-sm text-gray-700">{status}</p>}

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Nueva Contraseña</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full border p-2 rounded mt-1"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Confirmar Contraseña</label>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="w-full border p-2 rounded mt-1"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700" disabled={pending}>
            {pending ? "Guardando..." : "Guardar y Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
