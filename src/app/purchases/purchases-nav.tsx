"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/purchases/requests", label: "Requests" },
  { href: "/purchases/orders", label: "Orders" },
  { href: "/purchases/suppliers", label: "Suppliers" },
];

export function PurchasesNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 border-b pb-2">
      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
