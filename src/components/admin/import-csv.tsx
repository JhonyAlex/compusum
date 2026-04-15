"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, ChevronDown, ChevronUp, ArrowRight, ArrowLeft,
  Package, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCSV } from "@/lib/csv";
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

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
}

// ─── constants ────────────────────────────────────────────────────────────────

/**
 * Adaptive batching prevents saturating the backend when products have many variants.
 * Each batch stops on max product count OR max variant "weight".
 */
const MIN_PRODUCTS_PER_BATCH = 12;
const MAX_PRODUCTS_PER_BATCH = 28;
const MAX_VARIANT_WEIGHT_PER_BATCH = 120;
const MAX_RETRIES_PER_BATCH = 2;

// ─── component ────────────────────────────────────────────────────────────────

export function ImportadorCSV() {
  // ── state ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [skipGeneric, setSkipGeneric] = useState(true);
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

  // ── derived: grouped products (computed when on preview/importing) ─────
  const groupResult: GroupResult | null = useMemo(() => {
    if (rows.length === 0 || !mapping.reference) return null;
    return groupRowsIntoProducts(rows, mapping, skipGeneric);
  }, [rows, mapping, skipGeneric]);

  // ── mapping validation ────────────────────────────────────────────────────
  const mappingValid = useMemo(() => {
    const requiredFields = PRODUCT_FIELDS.filter((f) => f.required);
    return requiredFields.every((f) => mapping[f.key]);
  }, [mapping]);

  const preflightReport: PreflightReport | null = useMemo(() => {
    if (!groupResult) return null;

    const critical: string[] = [];
    const warnings: string[] = [];

    if (!mappingValid) {
      critical.push("Faltan campos obligatorios en el mapeo.");
    }
    if (groupResult.products.length === 0) {
      critical.push("No hay productos válidos para importar.");
    }

    const productsWithoutVariants = groupResult.products.filter((p) => p.variants.length === 0).length;
    if (productsWithoutVariants > 0) {
      warnings.push(`${productsWithoutVariants} producto(s) quedarán sin variaciones.`);
    }

    const productsWithoutPrice = groupResult.products.filter((p) => {
      const hasProductPrice = hasValue(p.price);
      const hasVariantPrice = p.variants.some((v) => hasValue(v.price));
      return !hasProductPrice && !hasVariantPrice;
    }).length;
    if (productsWithoutPrice > 0) {
      warnings.push(`${productsWithoutPrice} producto(s) no tienen precio en CSV.`);
    }

    if (groupResult.errors.length > 0) {
      warnings.push(`Se detectaron ${groupResult.errors.length} advertencias en el agrupado.`);
    }

    return { critical, warnings };
  }, [groupResult, mappingValid]);

  const canStartImport = useMemo(() => {
    return Boolean(
      groupResult
      && preflightReport
      && preflightRun
      && preflightAccepted
      && preflightReport.critical.length === 0,
    );
  }, [groupResult, preflightReport, preflightRun, preflightAccepted]);

  useEffect(() => {
    setPreflightRun(false);
    setPreflightAccepted(false);
  }, [mapping, skipGeneric, rows]);

  // ── file handling ─────────────────────────────────────────────────────────
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

    // Auto-detect mapping
    const detected = detectDefaultMapping(headers);
    setMapping(detected);
    setStep("mapping");
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── mapping update ────────────────────────────────────────────────────────
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

  // ── import ────────────────────────────────────────────────────────────────
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

    if (current.length > 0) {
      batches.push(current);
    }

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

      // Yield to the browser to keep UI updates responsive during long imports.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    setResult(accumulated);
    setImportErrors(accumulated.errors);
    setStep("done");
  };

  const reset = () => {
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

  // ─── Step badge ──────────────────────────────────────────────────────────
  const StepBadge = ({ n, active }: { n: number; active: boolean }) => (
    <span className={cn(
      "w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0",
      active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500",
    )}>
      {n}
    </span>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">

      {/* ── Step 1: Upload CSV ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <StepBadge n={1} active={step === "upload"} />
            Subir archivo CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === "upload" ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                  isDragging ? "border-blue-400 bg-blue-50"
                    : parseError ? "border-red-300 bg-red-50"
                    : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
                )}
              >
                <Upload className={cn("h-10 w-10 mx-auto mb-3", parseError ? "text-red-400" : "text-slate-400")} />
                <p className="font-medium text-slate-700">
                  Arrastra tu CSV aquí o haz clic para elegir
                </p>
                <p className="text-sm text-slate-400 mt-1">Solo archivos .csv</p>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onInputChange} />
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
                <Button variant="ghost" size="sm" onClick={reset}>Cambiar</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Step 2: Field Mapping ────────────────────────────────────────── */}
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
                  Relaciona las columnas de tu CSV con los campos de producto. Los campos marcados con * son obligatorios.
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

                {/* Sample data preview */}
                {mapping.reference && rows.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 mb-2">Vista previa (primera fila):</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {PRODUCT_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <div key={f.key} className="flex gap-1">
                          <span className="text-slate-400">{f.label}:</span>
                          <span className="text-slate-700 font-medium truncate">
                            {rows[0][mapping[f.key]!] || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

      {/* ── Step 3: Preview & Configure ──────────────────────────────────── */}
      {(step === "preview" || step === "importing" || step === "done") && groupResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <StepBadge n={3} active={step === "preview"} />
              Vista previa e importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
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

            {/* Grouping errors */}
            {groupResult.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">{groupResult.errors.length} advertencia{groupResult.errors.length !== 1 ? "s" : ""} al agrupar:</p>
                  <ul className="text-xs space-y-0.5 list-disc list-inside max-h-24 overflow-y-auto">
                    {groupResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    {groupResult.errors.length > 10 && (
                      <li className="text-slate-400">…y {groupResult.errors.length - 10} más</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {step === "preview" && (
              <>
                {/* Options */}
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-slate-700">Opciones de importación</p>

                  {/* Duplicate mode */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDuplicateMode("skip")}
                      className={cn(
                        "text-left p-3 rounded-lg border-2 transition-colors",
                        duplicateMode === "skip" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <p className="font-medium text-sm text-slate-900">Ignorar duplicados</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Si el SKU ya existe, no lo modifica.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateMode("update")}
                      className={cn(
                        "text-left p-3 rounded-lg border-2 transition-colors",
                        duplicateMode === "update" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <p className="font-medium text-sm text-slate-900">Actualizar duplicados</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sobreescribe datos si el SKU ya existe.
                      </p>
                    </button>
                  </div>

                  {/* Skip generic */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipGeneric}
                      onChange={(e) => setSkipGeneric(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">
                      Omitir variación "Genérico" o "No subir" en productos con una sola fila
                    </span>
                  </label>
                </div>

                {/* Mandatory preflight validation */}
                <div className="pt-3 space-y-3 border-t border-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">
                      Validación previa obligatoria
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreflightRun(true)}
                    >
                      Ejecutar validación
                    </Button>
                  </div>

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
                        {preflightReport.critical.length > 0 && (
                          <ul className="mt-1 list-disc list-inside text-xs">
                            {preflightReport.critical.map((msg, i) => <li key={i}>{msg}</li>)}
                          </ul>
                        )}
                      </div>

                      {preflightReport.warnings.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="font-medium text-amber-800">Advertencias de validación</p>
                          <ul className="mt-1 list-disc list-inside text-xs text-amber-700">
                            {preflightReport.warnings.map((msg, i) => <li key={i}>{msg}</li>)}
                          </ul>
                        </div>
                      )}

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

                {/* Sample products */}
                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-500 mb-2">Muestra de productos agrupados:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {groupResult.products.slice(0, 5).map((p) => (
                      <div key={p.reference} className="flex items-start gap-2 p-2 bg-slate-50 rounded text-xs">
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono shrink-0">
                          {p.reference}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-700 truncate">{p.name}</p>
                          {p.variants.length > 0 && (
                            <p className="text-slate-400">
                              {p.variants.length} variación{p.variants.length !== 1 ? "es" : ""}:
                              {" "}{p.variants.slice(0, 4).map((v) => v.name).join(", ")}
                              {p.variants.length > 4 && ` …+${p.variants.length - 4}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {groupResult.products.length > 5 && (
                      <p className="text-xs text-slate-400 text-center">
                        …y {groupResult.products.length - 5} productos más
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
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

            {/* Importing progress */}
            {step === "importing" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Procesando… {progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-slate-400">
                  Progreso real: {processedProducts} / {groupResult.stats.uniqueProducts} productos procesados
                  · lote {Math.max(processedBatches, 1)} de {Math.max(totalBatches, 1)}.
                </p>
              </div>
            )}

            {/* Done */}
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
                  <div className={cn(
                    "rounded-lg p-3 text-center border",
                    importErrors.length > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200",
                  )}>
                    {importErrors.length > 0
                      ? <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                      : <CheckCircle2 className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                    }
                    <p className={cn("text-2xl font-bold", importErrors.length > 0 ? "text-red-700" : "text-slate-500")}>
                      {importErrors.length}
                    </p>
                    <p className={cn("text-xs", importErrors.length > 0 ? "text-red-600" : "text-slate-400")}>
                      Con error
                    </p>
                  </div>
                </div>

                {result.skipped > 0 && (
                  <p className="text-sm text-slate-500 text-center">
                    {result.skipped} producto{result.skipped !== 1 ? "s omitidos" : " omitido"} (SKU duplicado)
                  </p>
                )}

                {importErrors.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowErrors(!showErrors)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      {showErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Ver detalle de errores ({importErrors.length})
                    </button>
                    {showErrors && (
                      <ul className="mt-2 space-y-1 text-xs text-red-600 bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                        {importErrors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                <Button variant="outline" onClick={reset} className="w-full">
                  Importar otro archivo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
