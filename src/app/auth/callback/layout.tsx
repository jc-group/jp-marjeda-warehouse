import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Autenticando | JP Marjeda Warehouse",
  description: "Procesando tu inicio de sesión y configurando la sesión segura.",
};

export default function AuthCallbackLayout({ children }: { children: ReactNode }) {
  return children;
}
