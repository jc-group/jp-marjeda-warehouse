export class SupabaseCurrencyRepo {
  async getExchangeRateToMxn(currencyCode: string): Promise<number> {
    const normalized = currencyCode.toUpperCase();
    if (normalized === "MXN") return 1;

    const url = `https://api.frankfurter.dev/v1/latest?base=${normalized}&symbols=MXN`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("No se pudo obtener la tasa de cambio en Frankfurter.");
    }

    const data = (await response.json()) as {
      base?: string;
      rates?: { MXN?: number };
    };

    const rate = data?.rates?.MXN;
    if (!rate || typeof rate !== "number" || rate <= 0) {
      throw new Error("Respuesta inválida de la API de divisas.");
    }

    return rate;
  }
}
