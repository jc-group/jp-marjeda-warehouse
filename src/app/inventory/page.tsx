"use client"

import { useEffect, useState } from "react";

import { Tables } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

type InventoryItem = Tables<"inventory"> & {
  product: Pick<Tables<"products">, "name" | "sku"> | null;
  location: Pick<Tables<"locations">, "code" | "type"> | null;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("inventory")
          .select(
            `
            id,
            quantity,
            product:products(name, sku),
            location:locations(code, type)
          `
          )
          .limit(50);

        if (queryError) {
          setError(queryError.message);
        } else if (data) {
          setItems(data as InventoryItem[]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unexpected error creating Supabase client"
        );
      }

      setLoading(false);
    };

    fetchInventory();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Inventory
          </p>
          <h1 className="text-3xl font-semibold">Stock overview</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Quick client-side check using the Supabase browser client.
          </p>
        </header>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="px-4 py-4" colSpan={5}>
                      Loading inventory...
                    </td>
                  </tr>
                )}

                {error && !loading && (
                  <tr>
                    <td className="px-4 py-4 text-red-600" colSpan={5}>
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-zinc-500" colSpan={5}>
                      No inventory records found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-100 text-sm dark:border-zinc-800"
                    >
                      <td className="px-4 py-3">
                        {item.product?.name ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {item.product?.sku ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.location?.code ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.location?.type ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
