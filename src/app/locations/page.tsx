import type { Metadata } from "next";
import LocationFormClient from "./location-form-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Ubicaciones | JP Marjeda Warehouse",
  description: "Crea y gestiona códigos de racks, pasillos, zonas o muelles.",
};

export default async function LocationsPage() {
  const role = await getUserRole();
  return <LocationFormClient role={role} />;
}
