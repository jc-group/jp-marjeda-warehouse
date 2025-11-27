import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Iniciar sesión | JP Marjeda Warehouse",
  description: "Accede al panel de inventario y operaciones con tus credenciales.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
