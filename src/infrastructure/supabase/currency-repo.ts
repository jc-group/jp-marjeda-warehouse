import { createClient } from "@/utils/supabase/server";

export class SupabaseCurrencyRepo {
  async getExchangeRateToMxn(currencyCode: string): Promise<number> {
    const normalized = currencyCode.toUpperCase();
    if (normalized === "MXN") return 1;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("currency_rates")
      .select("rate, base_currency")
      .eq("currency_code", normalized)
      .maybeSingle();

    if (error || !data) {
      throw new Error("No se encontró la tasa de cambio para la divisa seleccionada.");
    }

    if (data.base_currency && data.base_currency !== "MXN") {
      throw new Error("La tasa de cambio no está expresada en MXN.");
    }

    return data.rate;
  }
}
