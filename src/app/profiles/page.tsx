import type { Metadata } from "next";
import ProfilesClient from "./profiles-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Perfiles de usuario | JP Marjeda Warehouse",
  description: "Lista de perfiles internos con roles y estados de acceso.",
};

export default async function ProfilesPage() {
  const role = await getUserRole();
  return <ProfilesClient role={role} />;
}
