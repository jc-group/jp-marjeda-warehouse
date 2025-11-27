import type { Metadata } from "next";
import ProductFormClient from "./product-form-client";

import { createClient } from "@/utils/supabase/server";
import { getUserRole } from "@/core/use-cases/get-user-role";

export const metadata: Metadata = {
  title: "Registrar producto | JP Marjeda Warehouse",
  description: "Alta de SKU con costo, divisa, proveedor e imagen de producto.",
};

export default async function NewProductPage() {
  const supabase = await createClient();
  const role = await getUserRole();

  const { data: locations = [] } = await supabase
    .from("locations")
    .select("id, code, type")
    .order("code", { ascending: true });

  const { data: suppliers = [] } = await supabase
    .from("suppliers")
    .select("id, company_name, rfc, is_active")
    .eq("is_active", true)
    .order("company_name", { ascending: true });

  return (
    <ProductFormClient
      role={role}
      locations={locations.map((loc) => ({
        id: loc.id,
        code: loc.code,
        type: loc.type ?? undefined,
      }))}
      suppliers={suppliers.map((supplier) => ({
        id: supplier.id,
        companyName: supplier.company_name,
        rfc: supplier.rfc,
      }))}
    />
  );
}
