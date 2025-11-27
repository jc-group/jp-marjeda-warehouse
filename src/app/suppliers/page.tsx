import type { Metadata } from "next";
import SuppliersClient from "./suppliers-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Proveedores | JP Marjeda Warehouse",
  description: "Gestiona proveedores activos y sus RFC para compras y stock.",
};

export default async function SuppliersPage() {
  const role = await getUserRole();
  return <SuppliersClient role={role} />;
}
