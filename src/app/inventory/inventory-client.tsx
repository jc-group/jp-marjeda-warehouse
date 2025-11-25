"use client";

import { useEffect, useRef, useState, useActionState } from "react";

import { fetchInventory, InventoryRecord } from "@/data/inventory";
import { registerMovementAction } from "@/app/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/admin-shell";
import { useToast } from "@/components/ui/use-toast";

type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorOptions = { formats?: string[] };
declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats?: () => Promise<string[]>;
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
}

type InventoryClientProps = {
  role: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const getImageUrl = (path?: string | null) => {
  if (!path) return "/placeholder-box.png";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/products/${path}`;
};

export default function InventoryClient({ role }: InventoryClientProps) {
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementSku, setMovementSku] = useState("");
  const [movementLocation, setMovementLocation] = useState("");
  const [movementQuantity, setMovementQuantity] = useState("1");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [movementState, movementAction, movementPending] = useActionState(registerMovementAction, {
    success: false,
    message: "",
  });

  const canMove = role === "admin" || role === "operador";
  const { toast } = useToast();

  const stopScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startScan = async () => {
    setScanError(null);
    if (typeof window === "undefined") return;
    if (!("BarcodeDetector" in window)) {
      setScanError("Tu dispositivo no soporta escaneo. Ingresa el SKU manualmente.");
      return;
    }
    try {
      const detector = new BarcodeDetector({
        formats: ["ean_13", "code_128", "code_39", "ean_8", "upc_a", "upc_e", "qr_code"],
      });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const code = codes[0].rawValue;
            setMovementSku(code);
            stopScan();
          }
        } catch (err) {
          console.error("Scan error:", err);
        }
      }, 600);
    } catch (err) {
      console.error(err);
      setScanError("No se pudo iniciar la cámara");
      setScanning(false);
    }
  };

  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await fetchInventory(50);

      if (queryError) {
        setError(queryError.message);
      } else {
        setItems(data);
      }

      setLoading(false);
    };

    loadInventory();
  }, []);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  useEffect(() => {
    if (movementState.message) {
      toast({
        title: movementState.success ? "Listo" : "Error",
        description: movementState.message,
      });
    }
  }, [movementState, toast]);

  return (
    <>
      <AdminShell role={role}>
        <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-emerald-600">Dashboard</p>
            <h1 className="text-3xl font-semibold text-zinc-900">
              Inventario {role ? `(${role.toUpperCase()})` : ""}
            </h1>
            <p className="text-sm text-zinc-600">Visualiza stock, ubicaciones y prueba movimientos.</p>
          </div>
          {canMove && (
            <Button
              className="self-start sm:self-auto"
              variant="default"
              onClick={() => setMovementModalOpen(true)}
            >
              + Nuevo ingreso
            </Button>
          )}
        </div>

        {role === "auditor" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            👁️ Modo lectura: Solo visualización de stock.
          </div>
        )}

        {loading ? (
          <p>Cargando datos...</p>
        ) : error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : (
          <>
            <Card className="border-zinc-100 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Stock overview</CardTitle>
                <CardDescription>Productos, ubicaciones y cantidades actuales.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col rounded-xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-40 w-full overflow-hidden rounded-lg bg-zinc-100">
                        <img
                          src={getImageUrl(item.products?.image_url)}
                          alt={item.products?.name ?? "Producto"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-3 flex items-start justify-between">
                        <div>
                          <div className="text-xs uppercase text-zinc-500">SKU</div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {item.products?.sku ?? "—"}
                          </div>
                        </div>
                        <Badge variant="outline">{item.locations?.code ?? "—"}</Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="text-lg font-semibold text-zinc-900">
                          {item.products?.name ?? "Sin nombre"}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {item.products?.description ?? "Sin descripción"}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-zinc-600">Cantidad</span>
                        <span className="text-xl font-bold text-zinc-900">{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="p-4 text-center text-zinc-400">No hay inventario registrado.</div>
                )}
              </CardContent>
            </Card>

          </>
        )}
      </div>
    </AdminShell>

    {movementModalOpen && (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Registrar movimiento</h3>
              <p className="text-sm text-zinc-500">
                Escanea un código o ingresa datos manualmente.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setMovementModalOpen(false);
                setMovementSku("");
                setMovementLocation("");
                setMovementQuantity("1");
                stopScan();
                setScanError(null);
              }}
            >
              ✕
            </Button>
          </div>

          <form
            action={movementAction}
            className="mt-4 space-y-3"
            onSubmit={() => {
              stopScan();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="movementSku">SKU</Label>
              <Input
                id="movementSku"
                name="sku"
                placeholder="Escanea o escribe el SKU"
                value={movementSku}
                onChange={(e) => setMovementSku(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="movementLocation">Ubicación</Label>
              <Input
                id="movementLocation"
                name="location"
                placeholder="Ej: A-01-01"
                value={movementLocation}
                onChange={(e) => setMovementLocation(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="movementQuantity">Cantidad</Label>
              <Input
                id="movementQuantity"
                name="quantity"
                type="number"
                min="1"
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={startScan}
                disabled={scanning}
              >
                {scanning ? "Escaneando..." : "Usar cámara"}
              </Button>
              {scanError && <p className="text-xs text-red-600">{scanError}</p>}
            </div>

            {scanning && (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <video ref={videoRef} className="h-48 w-full bg-black object-cover" autoPlay muted />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMovementModalOpen(false);
                  setMovementSku("");
                  setMovementLocation("");
                  setMovementQuantity("1");
                  stopScan();
                  setScanError(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={movementPending}>
                {movementPending ? "Guardando..." : "Registrar"}
              </Button>
            </div>

            {movementState.message && (
              <p
                className={`text-sm ${
                  movementState.success ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {movementState.message}
              </p>
            )}
          </form>
        </div>
      </div>
    )}
  </>
  );
}
