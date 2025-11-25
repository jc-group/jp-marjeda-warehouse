import ProductFormClient from "./product-form-client";

import { getUserRole } from "@/core/use-cases/get-user-role";

export default async function NewProductPage() {
  const role = await getUserRole();
  return <ProductFormClient role={role} />;
}
