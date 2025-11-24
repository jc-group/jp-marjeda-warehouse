export type UserRole = "admin" | "operador" | "auditor" | string;

export function canMoveInventory(role: UserRole | null | undefined) {
  return role === "admin" || role === "operador";
}
