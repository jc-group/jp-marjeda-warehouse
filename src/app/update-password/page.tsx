"use client";

import { useState } from "react";

import { updatePasswordAction } from "./actions";

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow border">
        <h2 className="text-xl font-bold mb-4">Bienvenido al Equipo</h2>
        <p className="text-sm text-gray-600 mb-6">
          Para activar tu cuenta, por favor establece una contraseña segura.
        </p>

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
