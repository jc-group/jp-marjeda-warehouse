import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Definir contraseña | JP Marjeda Warehouse",
  description: "Actualiza o establece tu contraseña segura desde el enlace de invitación.",
};

export default function UpdatePasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
