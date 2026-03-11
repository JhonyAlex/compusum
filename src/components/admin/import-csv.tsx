"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  Download, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCSV, validateRequiredColumns } from "@/lib/csv";

// ─── types ────────────────────────────────────────────────────────────────────

type DuplicateMode = "skip" | "update";

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  done: boolean;
  totalRows: number;
  batchIndex: number;
  totalBatches: number;
}

type ImportStatus = "idle" | "validating" | "ready" | "importing" | "done" | "error";

// ─── helpers ──────────────────────────────────────────────────────────────────

function validateRows(rows: Record<string, string>[]): string[] {
  const errors: string[] = [];
  if (rows.length === 0) { errors.push("El archivo no contiene datos"); return errors; }

  const missing = validateRequiredColumns(rows);
  if (missing.length) {
    errors.push(`Columnas requeridas ausentes: ${missing.join(", ")}`);
    return errors;
  }

  rows.forEach((row, i) => {
    const rowNum = i + 2;
    if (!row["nombre"]?.trim()) errors.push(`Fila ${rowNum}: "nombre" vacío`);
    if (!row["sku"]?.trim()) errors.push(`Fila ${rowNum}: "sku" vacío`);
    if (!row["categoria"]?.trim()) errors.push(`Fila ${rowNum}: "categoría" vacía`);
    const priceRaw = row["precio"]?.replace(/[^\d.,]/g, "").replace(",", ".");
    if (priceRaw && isNaN(parseFloat(priceRaw))) {
      errors.push(`Fila ${rowNum}: precio inválido "${row["precio"]}"`);
    }
    const wp = row["precio descuento"]?.replace(/[^\d.,]/g, "").replace(",", ".");
    if (wp && isNaN(parseFloat(wp))) {
      errors.push(`Fila ${rowNum}: precio descuento inválido "${row["precio descuento"]}"`);
    }
  });
  return errors;
}

// ─── component ────────────────────────────────────────────────────────────────

const BATCH_SIZE = 50;

export function ImportadorCSV() {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // ── file selection ──────────────────────────────────────────────────────
  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setStatus("error");
      setValidationErrors(["Solo se admiten archivos .csv"]);
      return;
    }
    setFile(f);
    setStatus("validating");
    setValidationErrors([]);
    setResult(null);

    const text = await f.text();
    const parsed = parseCSV(text);
    const errors = validateRows(parsed);

    if (errors.length > 0) {
      setValidationErrors(errors);
      setStatus("error");
    } else {
      setRows(parsed);
      setStatus("ready");
    }
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

  // ── import ──────────────────────────────────────────────────────────────
  const startImport = async () => {
    if (!rows.length) return;
    abortRef.current = false;
    setStatus("importing");
    setProgress(0);

    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
    const accumulated: ImportResult = {
      created: 0, updated: 0, skipped: 0, errors: [],
      done: false, totalRows: rows.length, batchIndex: 0, totalBatches,
    };

    for (let i = 0; i < totalBatches; i++) {
      if (abortRef.current) break;

      const batch = rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      try {
        const res = await fetch(
          `/api/admin/import?duplicateMode=${duplicateMode}&batchIndex=${i}&batchSize=${BATCH_SIZE}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: batch }),
          },
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          accumulated.errors.push(json.error ?? `Lote ${i + 1} falló`);
        } else {
          accumulated.created += json.data.created;
          accumulated.updated += json.data.updated;
          accumulated.skipped += json.data.skipped;
          accumulated.errors.push(...json.data.errors);
        }
      } catch {
        accumulated.errors.push(`Lote ${i + 1}: error de red`);
      }

      setProgress(Math.round(((i + 1) / totalBatches) * 100));
    }

    accumulated.done = true;
    setResult(accumulated);
    setStatus("done");
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setRows([]);
    setValidationErrors([]);
    setProgress(0);
    setResult(null);
    setShowErrors(false);
    abortRef.current = false;
  };

  // ── template download ───────────────────────────────────────────────────
  const downloadTemplate = () => {
    const headers = [
      "marca", "nombre", "sku", "precio", "precio descuento",
      "categoria", "subcategoria", "descripcion corta", "descripcion larga", "imagen",
    ];
    const example = [
      "Samsung", "Disco Duro 1TB", "SAM-HDD-001", "150000", "129000",
      "Almacenamiento", "Discos duros", "Disco de 1 TB para laptops", "Almacenamiento rápido y confiable", "https://ejemplo.com/img.jpg",
    ];
    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-importacion.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      {/* Step 1 – duplicate mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Configurar comportamiento de duplicados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            onClick={() => setDuplicateMode("skip")}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-colors",
              duplicateMode === "skip" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300",
            )}
          >
            <p className="font-medium text-slate-900">Ignorar duplicados</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Si el SKU ya existe, salta esa fila sin modificar nada.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setDuplicateMode("update")}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-colors",
              duplicateMode === "update" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300",
            )}
          >
            <p className="font-medium text-slate-900">Actualizar duplicados</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Si el SKU ya existe, sobreescribe nombre, precios, categoría e imagen con los datos nuevos.
            </p>
          </button>
        </CardContent>
      </Card>

      {/* Step 2 – file upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              Subir archivo CSV
            </span>
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs gap-1">
              <Download className="h-3.5 w-3.5" /> Descargar plantilla
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === "idle" || status === "error" ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                isDragging ? "border-blue-400 bg-blue-50"
                  : status === "error" ? "border-red-300 bg-red-50"
                  : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
              )}
            >
              <Upload className={cn("h-10 w-10 mx-auto mb-3", status === "error" ? "text-red-400" : "text-slate-400")} />
              <p className="font-medium text-slate-700">
                {status === "error" && file ? `Error en "${file.name}"` : "Arrastra tu CSV aquí o haz clic para elegir"}
              </p>
              <p className="text-sm text-slate-400 mt-1">Solo archivos .csv · máx 10 MB</p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onInputChange} />
            </div>
          ) : null}

          {status === "validating" && (
            <div className="flex items-center gap-3 p-6 text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Validando archivo…</span>
            </div>
          )}

          {(status === "ready" || status === "importing" || status === "done") && file && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-sm text-slate-500">{rows.length} filas de datos detectadas</p>
              </div>
              {status !== "importing" && (
                <Button variant="ghost" size="sm" onClick={reset}>Cambiar</Button>
              )}
            </div>
          )}

          {/* Validation errors */}
          {status === "error" && validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">El archivo tiene {validationErrors.length} error{validationErrors.length !== 1 ? "es" : ""}:</p>
                <ul className="space-y-1 text-sm list-disc list-inside">
                  {validationErrors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  {validationErrors.length > 10 && (
                    <li className="text-slate-400">…y {validationErrors.length - 10} más</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Step 3 – import button & progress */}
      {(status === "ready" || status === "importing" || status === "done") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              Importar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "ready" && (
              <div className="flex gap-3">
                <Button onClick={startImport} className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Iniciar importación ({rows.length} productos)
                </Button>
                <Button variant="outline" onClick={reset}>Cancelar</Button>
              </div>
            )}

            {status === "importing" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Procesando… {progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-slate-400">
                  No cierres esta ventana. Se está cargando en lotes de {BATCH_SIZE}.
                </p>
              </div>
            )}

            {status === "done" && result && (
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
                    result.errors.length > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200",
                  )}>
                    {result.errors.length > 0
                      ? <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                      : <CheckCircle2 className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                    }
                    <p className={cn("text-2xl font-bold", result.errors.length > 0 ? "text-red-700" : "text-slate-500")}>
                      {result.errors.length}
                    </p>
                    <p className={cn("text-xs", result.errors.length > 0 ? "text-red-600" : "text-slate-400")}>
                      Con error
                    </p>
                  </div>
                </div>

                {result.skipped > 0 && (
                  <p className="text-sm text-slate-500 text-center">
                    {result.skipped} fil{result.skipped !== 1 ? "as omitidas" : "a omitida"} (SKU duplicado)
                  </p>
                )}

                {result.errors.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowErrors(!showErrors)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      {showErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Ver detalle de errores ({result.errors.length})
                    </button>
                    {showErrors && (
                      <ul className="mt-2 space-y-1 text-xs text-red-600 bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                        {result.errors.map((e, i) => <li key={i}>{e}</li>)}
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
