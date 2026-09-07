"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, ChevronDown, ChevronUp, ArrowRight, ArrowLeft,
  Package, Layers, ShieldCheck, Database, FileSpreadsheet, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCSV } from "@/lib/csv";
import { isSiesaPreflightApproved } from "@/lib/siesa-preflight";
import {
  PRODUCT_FIELDS,
  detectDefaultMapping,
  groupRowsIntoProducts,
  type FieldMapping,
  type ProductFieldKey,
  type GroupResult,
} from "@/lib/csv-import";

// ─── types ────────────────────────────────────────────────────────────────────

type DuplicateMode = "skip" | "update";
type Step = "upload" | "mapping" | "preview" | "importing" | "done";

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface PreflightReport {
  critical: string[];
  warnings: string[];
}

interface ImportBatchResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  processed: number;
}

interface SiesaPreflightSummary {
  totalRows: number;
  uniqueReferences: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  zeroPriceCount: number;
  absentDepletedCount: number;
  absentSampleSkus: string[];
  errors: string[];
}

interface SiesaSyncResult {
  syncLogId: string;
  fileHash: string;
  totalRows: number;
  uniqueReferences: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  zeroPriceCount: number;
  depletedCount: number;
  errorCount: number;
  errors: string[];
  durationMs: number;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
}

const MIN_PRODUCTS_PER_BATCH = 12;
const MAX_PRODUCTS_PER_BATCH = 28;
const MAX_VARIANT_WEIGHT_PER_BATCH = 120;
const MAX_RETRIES_PER_BATCH = 2;

// ─── component ────────────────────────────────────────────────────────────────

export function ImportadorCSV() {
  const [activeTab, setActiveTab] = useState<"siesa" | "generic">("siesa");

  // ═════════════════════════════════════════════════════════════════════════════
  // SIESA SYNCHRONIZER STATE (Binary / Multipart / CP1252 Preserved)
  // ═════════════════════════════════════════════════════════════════════════════
  const [siesaFile, setSiesaFile] = useState<File | null>(null);
  const [siesaStep, setSiesaStep] = useState<"select" | "preflight" | "syncing" | "done">("select");
  const [siesaLoading, setSiesaLoading] = useState(false);
  const [siesaPreflight, setSiesaPreflight] = useState<SiesaPreflightSummary | null>(null);
  const [siesaResult, setSiesaResult] = useState<SiesaSyncResult | null>(null);
  const [siesaReconcileAbsent, setSiesaReconcileAbsent] = useState(false);
  const [siesaConfirmed, setSiesaConfirmed] = useState(false);
  const [siesaError, setSiesaError] = useState<string | null>(null);
  const [siesaIsDragging, setSiesaIsDragging] = useState(false);
  const [siesaShowErrors, setSiesaShowErrors] = useState(false);
  const siesaFileInputRef = useRef<HTMLInputElement>(null);
  const siesaPreflightApproved = isSiesaPreflightApproved(siesaPreflight);

  // ── Siesa Handlers ──────────────────────────────────────────────────────────
  const handleSiesaFileSelect = async (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setSiesaError("Solo se admiten archivos .csv de Siesa");
      return;
    }
    setSiesaFile(f);
    setSiesaError(null);
    setSiesaPreflight(null);
    setSiesaResult(null);
    setSiesaConfirmed(false);
    setSiesaLoading(true);

    // Run Preflight immediately via multipart (preserving CP1252 original bytes)
    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("action", "preflight");

      const res = await fetch("/api/admin/siesa?action=preflight", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al analizar archivo Siesa");
      }

      setSiesaPreflight(json.data);
      // Reconcile is allowed only if 0 errors in preflight
      if (json.data.errors && json.data.errors.length > 0) {
        setSiesaReconcileAbsent(false);
      }
      setSiesaStep("preflight");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error durante el análisis del archivo";
      setSiesaError(msg);
      setSiesaStep("select");
    } finally {
      setSiesaLoading(false);
    }
  };

  const handleSiesaSync = async () => {
    if (!siesaFile || !siesaConfirmed || !siesaPreflightApproved) return;
    setSiesaLoading(true);
    setSiesaStep("syncing");
    setSiesaError(null);

    try {
      const formData = new FormData();
      formData.append("file", siesaFile);
      formData.append("action", "sync");
      formData.append("reconcileAbsent", String(siesaReconcileAbsent));

      const res = await fetch("/api/admin/siesa?action=sync", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error en la sincronización Siesa");
      }

      setSiesaResult(json.data);
      setSiesaStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error durante la sincronización";
      setSiesaError(msg);
      setSiesaStep("preflight");
    } finally {
      setSiesaLoading(false);
    }
  };

  const resetSiesa = () => {
    setSiesaFile(null);
    setSiesaStep("select");
    setSiesaPreflight(null);
    setSiesaResult(null);
    setSiesaConfirmed(false);
    setSiesaError(null);
    setSiesaLoading(false);
    setSiesaReconcileAbsent(false);
    if (siesaFileInputRef.current) siesaFileInputRef.current.value = "";
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // GENERIC CSV IMPORT STATE (Legacy manual column mapping)
  // ═════════════════════════════════════════════════════════════════════════════
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [skipGeneric, setSkipGeneric] = useState(true);
  const [skipNoSubir, setSkipNoSubir] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [processedProducts, setProcessedProducts] = useState(0);
  const [processedBatches, setProcessedBatches] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [preflightRun, setPreflightRun] = useState(false);
  const [preflightAccepted, setPreflightAccepted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const groupResult: GroupResult | null = useMemo(() => {
    if (rows.length === 0 || !mapping.reference) return null;
    return groupRowsIntoProducts(rows, mapping, skipGeneric, skipNoSubir);
  }, [rows, mapping, skipGeneric, skipNoSubir]);

  const mappingValid = useMemo(() => {
    const requiredFields = PRODUCT_FIELDS.filter((f) => f.required);
    return requiredFields.every((f) => mapping[f.key]);
  }, [mapping]);

  const preflightReport: PreflightReport | null = useMemo(() => {
    if (!groupResult) return null;

    const critical: string[] = [];
    const warnings: string[] = [];

    if (!mappingValid) critical.push("Faltan campos obligatorios en el mapeo.");
    if (groupResult.products.length === 0) critical.push("No hay productos válidos para importar.");

    const productsWithoutVariants = groupResult.products.filter((p) => p.variants.length === 0).length;
    if (productsWithoutVariants > 0) warnings.push(`${productsWithoutVariants} producto(s) quedarán sin variaciones.`);

    const productsWithoutPrice = groupResult.products.filter((p) => {
      const hasProductPrice = hasValue(p.price);
      const hasVariantPrice = p.variants.some((v) => hasValue(v.price));
      return !hasProductPrice && !hasVariantPrice;
    }).length;
    if (productsWithoutPrice > 0) warnings.push(`${productsWithoutPrice} producto(s) no tienen precio en CSV.`);

    if (groupResult.errors.length > 0) {
      warnings.push(`Se detectaron ${groupResult.errors.length} advertencias en el agrupado.`);
    }

    return { critical, warnings };
  }, [groupResult, mappingValid]);

  const canStartImport = useMemo(() => {
    return Boolean(
      groupResult &&
      preflightReport &&
      preflightRun &&
      preflightAccepted &&
      preflightReport.critical.length === 0
    );
  }, [groupResult, preflightReport, preflightRun, preflightAccepted]);

  useEffect(() => {
    setPreflightRun(false);
    setPreflightAccepted(false);
  }, [mapping, rows]);

  useEffect(() => {
    if (preflightRun) setPreflightAccepted(false);
  }, [duplicateMode, skipGeneric, skipNoSubir, preflightRun]);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setParseError("Solo se admiten archivos .csv");
      return;
    }
    setFile(f);
    setParseError(null);

    const text = await f.text();
    const parsed = parseCSV(text);

    if (parsed.length === 0) {
      setParseError("El archivo no contiene datos");
      return;
    }

    const headers = Object.keys(parsed[0]);
    setCsvHeaders(headers);
    setRows(parsed);

    const detected = detectDefaultMapping(headers);
    setMapping(detected);
    setStep("mapping");
  }, []);

  const updateMapping = (fieldKey: ProductFieldKey, csvColumn: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (csvColumn === "") {
        delete next[fieldKey];
      } else {
        next[fieldKey] = csvColumn;
      }
      return next;
    });
  };

  const buildAdaptiveBatches = (products: GroupResult["products"]) => {
    const batches: GroupResult["products"][] = [];
    let current: GroupResult["products"] = [];
    let currentWeight = 0;

    for (const product of products) {
      const productWeight = Math.max(1, product.variants.length);
      const exceedsWeight = currentWeight + productWeight > MAX_VARIANT_WEIGHT_PER_BATCH;
      const exceedsMaxCount = current.length >= MAX_PRODUCTS_PER_BATCH;
      const shouldFlush = current.length >= MIN_PRODUCTS_PER_BATCH && (exceedsWeight || exceedsMaxCount);

      if (shouldFlush) {
        batches.push(current);
        current = [];
        currentWeight = 0;
      }

      current.push(product);
      currentWeight += productWeight;
    }

    if (current.length > 0) batches.push(current);
    return batches;
  };

  const postBatch = async (
    batch: GroupResult["products"],
    retriesLeft = MAX_RETRIES_PER_BATCH,
  ): Promise<ImportBatchResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const res = await fetch(`/api/admin/import?duplicateMode=${duplicateMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: batch }),
        signal: controller.signal,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Error de importación en lote");
      }

      return {
        created: json.data.created ?? 0,
        updated: json.data.updated ?? 0,
        skipped: json.data.skipped ?? 0,
        errors: json.data.errors ?? [],
        processed: json.data.processed ?? batch.length,
      };
    } catch (error) {
      if (retriesLeft > 0 && !abortRef.current) {
        await new Promise((resolve) => setTimeout(resolve, (MAX_RETRIES_PER_BATCH - retriesLeft + 1) * 1000));
        return postBatch(batch, retriesLeft - 1);
      }

      const message = error instanceof Error ? error.message : "Error de red";
      return {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [`Lote fallido: ${message}`],
        processed: 0,
      };
    } finally {
      clearTimeout(timeout);
    }
  };

  const startImport = async () => {
    if (!groupResult || !canStartImport) return;
    abortRef.current = false;
    setStep("importing");
    setProgress(0);
    setImportErrors([]);
    setProcessedProducts(0);
    setProcessedBatches(0);

    const { products } = groupResult;
    const batches = buildAdaptiveBatches(products);
    setTotalBatches(batches.length);

    const accumulated: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
    let processed = 0;

    for (let i = 0; i < batches.length; i++) {
      if (abortRef.current) break;

      const response = await postBatch(batches[i]);
      accumulated.created += response.created;
      accumulated.updated += response.updated;
      accumulated.skipped += response.skipped;
      if (response.errors.length > 0) accumulated.errors.push(...response.errors);

      processed += response.processed;
      setProcessedProducts(processed);
      setProcessedBatches(i + 1);
      setProgress(Math.round((processed / products.length) * 100));

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    setResult(accumulated);
    setImportErrors(accumulated.errors);
    setStep("done");
  };

  const resetGeneric = () => {
    setStep("upload");
    setFile(null);
    setRows([]);
    setCsvHeaders([]);
    setMapping({});
    setProgress(0);
    setResult(null);
    setImportErrors([]);
    setShowErrors(false);
    setParseError(null);
    setProcessedProducts(0);
    setProcessedBatches(0);
    setTotalBatches(0);
    setPreflightRun(false);
    setPreflightAccepted(false);
    abortRef.current = false;
  };

  const StepBadge = ({ n, active }: { n: number; active: boolean }) => (
    <span className={cn(
      "w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0",
      active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500",
    )}>
      {n}
    </span>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* ── Mode Switcher Tab Bar ────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 pb-2 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("siesa")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2",
            activeTab === "siesa"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          <Database className="h-4 w-4" />
          Sincronizador Siesa ERP
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
            Oficial
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("generic")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2",
            activeTab === "generic"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Importador CSV Estándar (Manual)
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: SIESA SYNCHRONIZER                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "siesa" && (
        <div className="space-y-6">
          {/* Card: File Selection & Preflight */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Sincronización Automática con Productos.csv (Siesa)
                </span>
                <span className="text-xs font-normal text-slate-400">
                  Lectura binaria segura · CP1252 intacto · Bloqueo atómico PostgreSQL
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {siesaStep === "select" ? (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setSiesaIsDragging(true); }}
                    onDragLeave={() => setSiesaIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setSiesaIsDragging(false);
                      const f = e.dataTransfer.files[0];
                      if (f) handleSiesaFileSelect(f);
                    }}
                    onClick={() => siesaFileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                      siesaIsDragging ? "border-blue-500 bg-blue-50"
                        : siesaError ? "border-red-300 bg-red-50"
                        : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
                    )}
                  >
                    <Upload className={cn("h-10 w-10 mx-auto mb-3", siesaError ? "text-red-400" : "text-blue-500")} />
                    <p className="font-medium text-slate-700">
                      Selecciona o arrastra el archivo <span className="font-mono text-blue-700">Productos.csv</span>
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Exportación directa de Siesa en codificación CP1252 / Windows-1252
                    </p>
                    <input
                      ref={siesaFileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSiesaFileSelect(f);
                      }}
                    />
                  </div>

                  {siesaLoading && (
                    <div className="flex items-center justify-center gap-3 p-6 text-sm text-blue-600">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Analizando archivo Siesa y ejecutando preflight contra la base de datos…
                    </div>
                  )}

                  {siesaError && (
                    <Alert variant="destructive" className="mt-4">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{siesaError}</AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{siesaFile?.name}</p>
                      <p className="text-xs text-slate-500">
                        {siesaFile ? `${(siesaFile.size / 1024).toFixed(1)} KB` : ""} · Formato Siesa verificado
                      </p>
                    </div>
                  </div>
                  {siesaStep !== "syncing" && (
                    <Button variant="ghost" size="sm" onClick={resetSiesa}>
                      Cambiar archivo
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preflight Report Card */}
          {(siesaStep === "preflight" || siesaStep === "syncing") && siesaPreflight && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Resultado del Preflight (Análisis previo no mutante)</span>
                  {siesaPreflightApproved ? (
                    <span className="text-xs px-2.5 py-1 rounded bg-green-100 text-green-700 font-semibold">
                      Preflight Aprobado
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded bg-red-100 text-red-700 font-semibold">
                      Preflight Rechazado
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Filas en CSV</p>
                    <p className="text-2xl font-bold text-slate-800">{siesaPreflight.totalRows.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600 mb-1">Referencias Únicas</p>
                    <p className="text-2xl font-bold text-blue-700">{siesaPreflight.uniqueReferences.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-emerald-600 mb-1">Nuevas Referencias</p>
                    <p className="text-2xl font-bold text-emerald-700">{siesaPreflight.newCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-purple-600 mb-1">Por Actualizar</p>
                    <p className="text-2xl font-bold text-purple-700">{siesaPreflight.updatedCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Sin Cambios</p>
                    <p className="text-2xl font-bold text-slate-600">{siesaPreflight.unchangedCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-700 mb-1">Precio COP 0</p>
                    <p className="text-2xl font-bold text-amber-700">{siesaPreflight.zeroPriceCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center sm:col-span-2">
                    <p className="text-xs text-orange-700 mb-1">Ausentes en CSV con stock actual</p>
                    <p className="text-2xl font-bold text-orange-700">{siesaPreflight.absentDepletedCount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Price 0 Alert */}
                {siesaPreflight.zeroPriceCount > 0 && (
                  <Alert className="bg-amber-50/70 border-amber-200 text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs">
                      <strong>Protección COP 0 activa:</strong> Se detectaron {siesaPreflight.zeroPriceCount} referencias con precio $0,00.
                      Estos productos se importarán pero requerirán cotización; el sistema rechaza automáticamente cualquier intento de compra a COP 0.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Errors Alert */}
                {siesaPreflight.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <p className="font-semibold mb-1">
                        Se detectaron {siesaPreflight.errors.length} errores de formato/parser en el archivo:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                        {siesaPreflight.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                      <p className="mt-2 font-medium">
                        Por seguridad de datos, la sincronización completa ha sido bloqueada hasta corregir el archivo.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Confirmation & Reconcile Options */}
                {siesaStep === "preflight" && (
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <label className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer",
                      siesaPreflight.errors.length > 0 ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed" : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/50"
                    )}>
                      <input
                        type="checkbox"
                        checked={siesaReconcileAbsent}
                        onChange={(e) => setSiesaReconcileAbsent(e.target.checked)}
                        disabled={siesaPreflight.errors.length > 0}
                        className="mt-0.5 rounded border-slate-300"
                      />
                      <div className="text-xs text-slate-700">
                        <span className="font-medium">Reconciliar referencias ausentes:</span> Marcar con stock 0 y estado agotado
                        los productos Siesa que no aparecen en este archivo ({siesaPreflight.absentDepletedCount} productos identificados).
                        {siesaPreflight.errors.length > 0 && (
                          <p className="text-red-500 font-semibold mt-0.5">
                            Inhabilitado porque el archivo contiene errores estructurales.
                          </p>
                        )}
                      </div>
                    </label>

                    <label className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      siesaPreflightApproved
                        ? "border-blue-200 bg-blue-50/50 cursor-pointer"
                        : "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                    )}>
                      <input
                        type="checkbox"
                        checked={siesaConfirmed}
                        onChange={(e) => setSiesaConfirmed(e.target.checked)}
                        disabled={!siesaPreflightApproved}
                        className="mt-0.5 rounded border-blue-400"
                      />
                      <div className="text-xs text-slate-800">
                        <span className="font-semibold">Confirmación obligatoria:</span> He revisado el preflight y autorizo
                        la sincronización de {siesaPreflight.uniqueReferences.toLocaleString()} referencias en el catálogo oficial de Compusum.
                      </div>
                    </label>

                    {siesaError && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{siesaError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={resetSiesa}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSiesaSync}
                        disabled={!siesaPreflightApproved || !siesaConfirmed || siesaLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Iniciar Sincronización Siesa
                      </Button>
                    </div>
                  </div>
                )}

                {/* Syncing Progress */}
                {siesaStep === "syncing" && (
                  <div className="py-6 text-center space-y-3">
                    <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                    <p className="font-medium text-slate-800">Sincronizando catálogo con Siesa…</p>
                    <p className="text-xs text-slate-500">
                      Exclusión mutua activa en PostgreSQL. Procesando {siesaPreflight.uniqueReferences.toLocaleString()} referencias en lotes transaccionales.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Siesa Completed Result & Audit Card */}
          {siesaStep === "done" && siesaResult && (
            <Card className="border-green-200 bg-green-50/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  Sincronización Siesa Completada y Auditada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">ID de Auditoría:</span>
                    <span className="font-mono font-medium text-slate-800">{siesaResult.syncLogId}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Hash SHA-256 del archivo:</span>
                    <span className="font-mono text-slate-700 truncate max-w-xs">{siesaResult.fileHash}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Tiempo de ejecución:</span>
                    <span className="font-medium text-slate-800">{(siesaResult.durationMs / 1000).toFixed(2)} segundos</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-700">Creadas</p>
                    <p className="text-2xl font-bold text-green-800">{siesaResult.createdCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-700">Actualizadas</p>
                    <p className="text-2xl font-bold text-blue-800">{siesaResult.updatedCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Sin cambios</p>
                    <p className="text-2xl font-bold text-slate-700">{siesaResult.unchangedCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-orange-700">Ausentes agotadas</p>
                    <p className="text-2xl font-bold text-orange-800">{siesaResult.depletedCount.toLocaleString()}</p>
                  </div>
                </div>

                {siesaResult.errorCount > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setSiesaShowErrors(!siesaShowErrors)}
                      className="flex items-center gap-1 text-xs text-amber-700 font-semibold"
                    >
                      {siesaShowErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Advertencias registradas ({siesaResult.errorCount})
                    </button>
                    {siesaShowErrors && (
                      <ul className="mt-2 text-xs bg-amber-50 text-amber-900 rounded p-3 space-y-1 max-h-32 overflow-y-auto">
                        {siesaResult.errors.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <Button onClick={resetSiesa} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                  Sincronizar otro archivo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: GENERIC MANUAL CSV IMPORTER (LEGACY)                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "generic" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StepBadge n={1} active={step === "upload"} />
                Subir archivo CSV Genérico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === "upload" ? (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const f = e.dataTransfer.files[0];
                      if (f) handleFile(f);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                      isDragging ? "border-blue-400 bg-blue-50"
                        : parseError ? "border-red-300 bg-red-50"
                        : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
                    )}
                  >
                    <Upload className={cn("h-10 w-10 mx-auto mb-3", parseError ? "text-red-400" : "text-slate-400")} />
                    <p className="font-medium text-slate-700">Arrastra tu CSV aquí o haz clic para elegir</p>
                    <p className="text-sm text-slate-400 mt-1">Solo archivos .csv</p>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }} />
                  </div>
                  {parseError && (
                    <Alert variant="destructive" className="mt-4">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{parseError}</AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{file?.name}</p>
                    <p className="text-sm text-slate-500">{rows.length} filas · {csvHeaders.length} columnas detectadas</p>
                  </div>
                  {step !== "importing" && (
                    <Button variant="ghost" size="sm" onClick={resetGeneric}>Cambiar</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {step !== "upload" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <StepBadge n={2} active={step === "mapping"} />
                  Mapeo de campos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {step === "mapping" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                      Relaciona las columnas de tu CSV con los campos de producto.
                    </p>
                    <div className="space-y-3">
                      {PRODUCT_FIELDS.map((field) => {
                        const currentValue = mapping[field.key] ?? "";
                        return (
                          <div key={field.key} className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </p>
                              <p className="text-xs text-slate-400">{field.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                            <select
                              value={currentValue}
                              onChange={(e) => updateMapping(field.key, e.target.value)}
                              className={cn(
                                "w-full rounded-md border px-3 py-2 text-sm bg-white",
                                field.required && !currentValue
                                  ? "border-red-300 focus:ring-red-500"
                                  : "border-slate-200 focus:ring-blue-500",
                              )}
                            >
                              <option value="">— No mapear —</option>
                              {csvHeaders.map((h) => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={() => setStep("preview")} disabled={!mappingValid}>
                        Continuar <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    {Object.keys(mapping).length} campos mapeados
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {(step === "preview" || step === "importing" || step === "done") && groupResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <StepBadge n={3} active={step === "preview"} />
                  Vista previa e importación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-700">{groupResult.stats.uniqueProducts}</p>
                    <p className="text-xs text-blue-600">Productos</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <Layers className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-purple-700">{groupResult.stats.totalVariants}</p>
                    <p className="text-xs text-purple-600">Variaciones</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-slate-700">{groupResult.stats.productsWithVariants}</p>
                    <p className="text-xs text-slate-500">Con variaciones</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-slate-700">{groupResult.stats.totalRows}</p>
                    <p className="text-xs text-slate-500">Filas CSV</p>
                  </div>
                </div>

                {step === "preview" && (
                  <>
                    <div className="pt-3 space-y-3 border-t border-slate-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPreflightRun(true)}
                      >
                        Ejecutar validación
                      </Button>

                      {preflightRun && preflightReport && (
                        <div className="space-y-2 text-sm">
                          <div className={cn(
                            "rounded-lg border p-3",
                            preflightReport.critical.length === 0
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50",
                          )}>
                            <p className="font-medium">
                              {preflightReport.critical.length === 0
                                ? "Validación crítica aprobada"
                                : "Se encontraron bloqueos críticos"}
                            </p>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preflightAccepted}
                              onChange={(e) => setPreflightAccepted(e.target.checked)}
                              className="rounded border-slate-300"
                              disabled={preflightReport.critical.length > 0}
                            />
                            <span className="text-xs text-slate-700">
                              Confirmo que revisé la validación y autorizo iniciar la importación.
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setStep("mapping")}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver al mapeo
                      </Button>
                      <Button onClick={startImport} className="flex-1" disabled={!canStartImport}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar {groupResult.stats.uniqueProducts} productos
                      </Button>
                    </div>
                  </>
                )}

                {step === "importing" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                      <span>Procesando… {progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                )}

                {step === "done" && result && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-green-700">{result.created}</p>
                        <p className="text-xs text-green-600">Creados</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <RefreshCw className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-blue-700">{result.updated}</p>
                        <p className="text-xs text-blue-600">Actualizados</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-700">{result.skipped}</p>
                        <p className="text-xs text-slate-500">Omitidos</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={resetGeneric} className="w-full">
                      Importar otro archivo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
