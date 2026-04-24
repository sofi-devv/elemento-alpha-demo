"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  Receipt,
  CreditCard,
  Users,
  BarChart2,
  Landmark,
  ChevronRight,
  Loader2,
  ScanLine,
  Database,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { ChatWizard } from "@/components/sarlaft/ChatWizard";
import { FormsPreview } from "@/components/sarlaft/FormsPreview";
import type { OcrReportItem } from "@/lib/sarlaft/ocrTypes";
import type { SarlaftPackage } from "@/lib/sarlaft/schema";
import { hasMissingFields, computeMissingFields } from "@/lib/sarlaft/missingFields";
import { ensurePackageShape } from "@/lib/sarlaft/mergePackage";

type DocStatus = "pending" | "uploaded";

interface Document {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  requirement: string;
  status: DocStatus;
}

const initialDocs: Document[] = [
  {
    id: "camara",
    icon: Building2,
    title: "Certificado de Existencia y Representación Legal",
    description: "Expedido por la Cámara de Comercio con vigencia no mayor a 90 días.",
    requirement: "PDF · Vigencia máx. 90 días",
    status: "pending",
  },
  {
    id: "rut",
    icon: Receipt,
    title: "RUT (Registro Único Tributario)",
    description: "Copia actualizada y legible.",
    requirement: "PDF · Actualizado",
    status: "pending",
  },
  {
    id: "cedula",
    icon: CreditCard,
    title: "Documento de Identidad del Representante Legal",
    description: "Copia de la cédula del representante legal.",
    requirement: "PDF o imagen · Ambas caras",
    status: "pending",
  },
  {
    id: "accionaria",
    icon: Users,
    title: "Composición Accionaria",
    description: "Socios o accionistas con participación ≥ 5% (Beneficiario final).",
    requirement: "PDF · Firmado por Rep. Legal",
    status: "pending",
  },
  {
    id: "estados",
    icon: BarChart2,
    title: "Estados Financieros",
    description: "Último corte anual o año inmediatamente anterior.",
    requirement: "PDF · Certificados",
    status: "pending",
  },
  {
    id: "renta",
    icon: Landmark,
    title: "Declaración de Renta",
    description: "Copia del último periodo gravable disponible.",
    requirement: "PDF",
    status: "pending",
  },
];

const statusConfig: Record<DocStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: {
    label: "Pendiente",
    color: "border-gray-200 text-gray-400",
    icon: Clock,
  },
  uploaded: {
    label: "Cargado",
    color: "border-[#BBE795] text-[#6abf1a]",
    icon: CheckCircle2,
  },
};

const SARLAFT_RULES = [
  { label: "Lista OFAC / Clinton", db: "US Treasury" },
  { label: "Lista Consolidada ONU", db: "CSNU · ONU" },
  { label: "PEPs — Personas Expuestas Políticamente", db: "Procuraduría" },
  { label: "CICAD / OEA — Narcotráfico", db: "CICAD · OEA" },
  { label: "Bases de datos DIAN", db: "DIAN" },
  { label: "Listas Policía Nacional", db: "DIJIN" },
  { label: "SAGRILAFT — Beneficiario Final", db: "SFC" },
  { label: "Análisis de riesgo ML/FT", db: "Motor IA" },
];

function getRulesForDoc(docIdx: number) {
  const start = (docIdx * 3) % SARLAFT_RULES.length;
  return [0, 1, 2].map((i) => SARLAFT_RULES[(start + i) % SARLAFT_RULES.length]);
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function DocCard({
  doc,
  files,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
}: {
  doc: Document;
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClearFiles: () => void;
}) {
  const hasFile = files.length > 0;
  const config = statusConfig[hasFile ? "uploaded" : "pending"];
  const Icon = doc.icon;
  const StatusIco = config.icon;
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      className={`group relative flex gap-4 p-4 rounded-2xl ring-1 transition-all duration-300 ${
        hasFile
          ? "ring-[#BBE795]/40 bg-[#F0FEE6]/40 hover:ring-[#BBE795]/60"
          : "ring-gray-100 bg-white hover:ring-[#BBE795]/30 hover:shadow-sm"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xlsm,.xls"
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          if (picked.length) onAddFiles(picked);
          e.target.value = "";
        }}
      />
      <div
        className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors duration-300 ${
          hasFile ? "bg-[#BBE795]/20" : "bg-gray-50 group-hover:bg-[#F0FEE6]"
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-colors duration-300 ${
            hasFile ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a] leading-snug">{doc.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{doc.description}</p>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] font-semibold h-5 px-2 transition-all duration-300 ${config.color}`}
          >
            <StatusIco className="w-3 h-3 mr-1" />
            {hasFile ? `${files.length} archivo${files.length === 1 ? "" : "s"}` : config.label}
          </Badge>
        </div>

        {hasFile && (
          <ul className="mt-3 space-y-1.5">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 text-xs bg-white/80 rounded-lg border border-[#BBE795]/40 px-2.5 py-1.5"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-[#6abf1a]" />
                <span className="min-w-0 truncate text-[#1a1a1a] font-medium">{f.name}</span>
                <span className="ml-auto text-[10px] text-gray-400 tabular-nums shrink-0">
                  {formatBytes(f.size)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(i);
                  }}
                  className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Eliminar archivo"
                  title="Eliminar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="inline-flex items-center text-[11px] text-gray-400 font-medium gap-1">
            <FileText className="w-3 h-3" />
            {doc.requirement}
          </span>
          <div className="flex items-center gap-3">
            {hasFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFiles();
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Quitar todos
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
                hasFile ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"
              }`}
            >
              {hasFile ? <Plus className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{hasFile ? "Añadir más archivos" : "Cargar documento(s)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const EXTRACT_SERVER_ORDER = ["camara", "rut", "cedula", "accionaria", "estados", "renta"] as const;

function firstUploadedDocId(files: Record<string, File[] | undefined>): string | null {
  for (const id of EXTRACT_SERVER_ORDER) {
    if (files[id]?.length) return id;
  }
  return null;
}

function countUploadedFiles(files: Record<string, File[] | undefined>): number {
  return EXTRACT_SERVER_ORDER.reduce((acc, id) => acc + (files[id]?.length ?? 0), 0);
}

/** Misma estilo que la verificación; `activeDocId` sigue al documento que la API está procesando (hasta que Gemini responde). */
function ExtractionAnimationPanel({
  docs,
  activeDocId,
  stepIndex,
  stepTotal,
  activePageCount,
  activePending,
}: {
  docs: Document[];
  activeDocId: string | null;
  stepIndex: number;
  stepTotal: number;
  activePageCount: number | null;
  activePending: number | null;
}) {
  const [scanPos, setScanPos] = useState(0);
  const currentDocIdx = Math.max(
    0,
    activeDocId ? docs.findIndex((d) => d.id === activeDocId) : 0
  );
  const rules = getRulesForDoc(currentDocIdx);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPos((p) => (p >= 100 ? 0 : p + 2));
    }, 18);
    return () => clearInterval(interval);
  }, []);

  const currentDoc = docs[currentDocIdx] ?? docs[0];
  const CurrentIcon = currentDoc?.icon ?? FileText;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest mb-0.5">Extracción con IA</p>
          <h2 className="text-lg font-bold text-[#1a1a1a]">
            Procesando documento {stepIndex} de {stepTotal}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full ring-1 ring-blue-100">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          En proceso
        </div>
      </div>
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center min-h-[220px]">
          <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documentación</p>
            <div className="relative w-full max-w-[180px] mx-auto">
              <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-white p-4 min-h-[180px]">
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#6abf1a] to-transparent opacity-80 z-10"
                  style={{ top: `${scanPos}%` }}
                />
                <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-3 mx-auto bg-gray-100">
                  <CurrentIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="space-y-1.5">
                  {[100, 75, 90, 60, 80].map((w, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full ${
                        scanPos > i * 20 ? "bg-[#BBE795]/60" : "bg-gray-100"
                      }`}
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-center text-gray-500 mt-2 font-medium leading-snug line-clamp-2">
                {currentDoc?.title}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 px-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-px h-5 rounded-full bg-[#BBE795]" />
            ))}
            <div className="my-1 rounded-full p-1.5 bg-[#BBE795]/20 ring-1 ring-[#BBE795]/40">
              <Database className="w-4 h-4 text-[#6abf1a]" />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i + 3} className="w-px h-5 rounded-full bg-[#BBE795]" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SARLAFT / Formularios</p>
            {rules.map((rule) => (
              <div
                key={rule.label}
                className="flex items-start gap-2 p-2.5 rounded-xl ring-1 bg-[#F0FEE6]/80 ring-[#BBE795]/30"
              >
                <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-blue-100">
                  <Loader2 className="w-2.5 h-2.5 text-blue-500 animate-spin" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#1a1a1a] leading-snug">{rule.label}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{rule.db}</p>
                </div>
              </div>
            ))}
            <div className="space-y-2 mt-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-gray-50 ring-1 ring-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ScanLine className="w-4 h-4 shrink-0 text-[#6abf1a] animate-pulse" />
            <p className="text-xs text-gray-500 font-medium truncate">
              {activePageCount && activePageCount > 1
                ? `Leyendo ${activePageCount} páginas como imágenes…`
                : "Procesando documento como imagen…"}
            </p>
          </div>
          {activePending !== null && (
            <span className="sm:ml-auto text-[11px] font-semibold text-[#6abf1a] bg-[#F0FEE6] ring-1 ring-[#BBE795]/40 px-2 py-1 rounded-full w-fit">
              {activePending === 0 ? "Sin pendientes — solo confirmando" : `${activePending} variables pendientes`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

type AfterPhase = "none" | "extraction" | "extractingAnim" | "wizard" | "preview" | "error";

export default function SarlaftPage() {
  const [files, setFiles] = useState<Record<string, File[] | undefined>>({});
  const [docs] = useState<Document[]>(initialDocs);
  const [afterPhase, setAfterPhase] = useState<AfterPhase>("none");
  const [pkg, setPkg] = useState<SarlaftPackage | null>(null);
  const [ocrReport, setOcrReport] = useState<OcrReportItem[] | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractActiveDocId, setExtractActiveDocId] = useState<string | null>(null);
  const [extractStepIndex, setExtractStepIndex] = useState(1);
  const [extractStepTotal, setExtractStepTotal] = useState(1);
  const [extractActivePageCount, setExtractActivePageCount] = useState<number | null>(null);
  const [extractActivePending, setExtractActivePending] = useState<number | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const allFilesUploaded = docs.every((d) => (files[d.id]?.length ?? 0) > 0);
  const coveredDocsCount = docs.filter((d) => (files[d.id]?.length ?? 0) > 0).length;
  const totalFilesCount = countUploadedFiles(files);

  const addFiles = useCallback((id: string, picked: File[]) => {
    if (!picked.length) return;
    setFiles((prev) => {
      const existing = prev[id] ?? [];
      const byKey = new Set(existing.map((f) => `${f.name}:${f.size}:${f.lastModified}`));
      const merged = [...existing];
      for (const f of picked) {
        const k = `${f.name}:${f.size}:${f.lastModified}`;
        if (!byKey.has(k)) {
          byKey.add(k);
          merged.push(f);
        }
      }
      return { ...prev, [id]: merged };
    });
  }, []);

  const removeFileAt = useCallback((id: string, index: number) => {
    setFiles((prev) => {
      const existing = prev[id] ?? [];
      const next = existing.filter((_, i) => i !== index);
      const n = { ...prev };
      if (next.length === 0) delete n[id];
      else n[id] = next;
      return n;
    });
  }, []);

  const clearFiles = useCallback((id: string) => {
    setFiles((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  }, []);

  const runExtract = useCallback(async () => {
    setIsExtracting(true);
    setExtractError(null);
    setOcrReport(null);
    const nDocs = countUploadedFiles(files);
    setExtractStepTotal(Math.max(1, nDocs));
    setExtractStepIndex(1);
    setExtractActiveDocId(firstUploadedDocId(files));
    setExtractActivePageCount(null);
    setExtractActivePending(null);
    let sawComplete = false;
    try {
      const formData = new FormData();
      for (const d of docs) {
        const fs = files[d.id] ?? [];
        for (const f of fs) formData.append(d.id, f);
      }
      if (typeof window !== "undefined") {
        const kyc = sessionStorage.getItem("kyc_financial_summary");
        if (kyc) formData.append("financialSummary", kyc);
      }
      const res = await fetch("/api/sarlaft/extract", { method: "POST", body: formData });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Error al extraer");
      }
      if (!ct.includes("ndjson") || !res.body) {
        throw new Error("Respuesta de extracción no válida.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const handleLine = (line: string) => {
        if (!line.trim()) return;
        const ev = JSON.parse(line) as
          | {
              type: "doc_start";
              docId: string;
              fileName: string;
              index: number;
              total: number;
              pageCount?: number;
              kind?: string;
              pendingCount?: number;
            }
          | { type: "doc_done"; docId: string; pendingCount?: number }
          | { type: "complete"; package: SarlaftPackage; ocrReport: OcrReportItem[] }
          | { type: "error"; message: string };
        if (ev.type === "doc_start") {
          setExtractActiveDocId(ev.docId);
          setExtractStepIndex(ev.index);
          setExtractStepTotal(ev.total);
          setExtractActivePageCount(ev.pageCount ?? null);
          setExtractActivePending(typeof ev.pendingCount === "number" ? ev.pendingCount : null);
        } else if (ev.type === "doc_done") {
          if (typeof ev.pendingCount === "number") {
            setExtractActivePending(ev.pendingCount);
          }
        } else if (ev.type === "error") {
          throw new Error(ev.message);
        } else if (ev.type === "complete") {
          sawComplete = true;
          const safePkg = ensurePackageShape(ev.package);
          setPkg(safePkg);
          setOcrReport(Array.isArray(ev.ocrReport) ? ev.ocrReport : null);
          setAfterPhase(hasMissingFields(safePkg) ? "wizard" : "preview");
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          handleLine(line);
        }
      }
      if (buffer.trim()) {
        handleLine(buffer);
      }
      if (!sawComplete) {
        throw new Error("La extracción no devolvió resultado completo.");
      }
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Error desconocido");
      setAfterPhase("error");
    } finally {
      setIsExtracting(false);
      setExtractActiveDocId(null);
    }
  }, [docs, files]);

  const onWizardDone = useCallback((p: SarlaftPackage) => {
    setPkg(p);
    setAfterPhase("preview");
  }, []);

  const onGeneratePdf = useCallback(async () => {
    if (!pkg) return;
    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/sarlaft/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al generar PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "paquete_vinculacion_skandia.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Error PDF");
    } finally {
      setGeneratingPdf(false);
    }
  }, [pkg]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button type="button" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
            </Link>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Onboarding · Fase 1</p>
              <h1 className="text-base font-semibold text-[#1a1a1a] leading-tight">Procedimiento SARLAFT</h1>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-[#1a1a1a]">{coveredDocsCount}</span> de {docs.length} documentos
            {totalFilesCount > coveredDocsCount && (
              <span className="ml-1 text-xs text-gray-400">· {totalFilesCount} archivos</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {afterPhase === "none" && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-[#6abf1a]" />
                <span className="text-sm font-semibold text-[#6abf1a] uppercase tracking-wider">Vinculación Empresarial</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-2">Soporte documental</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                El formulario de vinculación SARLAFT se genera en la app a partir de tu información; no debes
                subirlo aquí. Carga solo los soportes (cámara de comercio, RUT, cédula del representante, etc.)
                en PDF, imagen o Excel para que la IA extraiga los datos.
              </p>
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#1a1a1a]">Progreso de carga</span>
                <span className={`text-sm font-bold ${allFilesUploaded ? "text-[#6abf1a]" : "text-gray-400"}`}>
                  {Math.round((coveredDocsCount / docs.length) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[#BBE795] to-[#7dd83a]"
                  style={{ width: `${(coveredDocsCount / docs.length) * 100}%` }}
                />
              </div>
              {totalFilesCount > 0 && (
                <p className="text-[11px] text-gray-400 mt-2">
                  {totalFilesCount} archivo{totalFilesCount === 1 ? "" : "s"} listos para análisis.
                </p>
              )}
            </div>
            <div className="grid gap-3 mb-8">
              {docs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  files={files[doc.id] ?? []}
                  onAddFiles={(fs) => addFiles(doc.id, fs)}
                  onRemoveFile={(i) => removeFileAt(doc.id, i)}
                  onClearFiles={() => clearFiles(doc.id)}
                />
              ))}
            </div>
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white ring-1 ring-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  {allFilesUploaded ? "Listo para extraer datos" : "Sube todos los documentos"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 max-w-sm">Una sola secuencia: se analizará cada archivo por turno y se rellenarán los formularios.</p>
              </div>
              <Button
                disabled={!allFilesUploaded}
                onClick={() => {
                  setAfterPhase("extraction");
                  void runExtract();
                }}
                className={`flex items-center gap-2 font-semibold ${
                  allFilesUploaded
                    ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Extraer datos con IA
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {afterPhase === "extraction" && (
          <>
            {isExtracting ? (
              <ExtractionAnimationPanel
                docs={docs}
                activeDocId={extractActiveDocId}
                stepIndex={extractStepIndex}
                stepTotal={extractStepTotal}
                activePageCount={extractActivePageCount}
                activePending={extractActivePending}
              />
            ) : (
              <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-12 text-center">
                <Loader2 className="w-9 h-9 text-[#6abf1a] animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">Iniciando análisis…</p>
              </div>
            )}
          </>
        )}

        {afterPhase === "extractingAnim" && (
          <ExtractionAnimationPanel
            docs={docs}
            activeDocId={extractActiveDocId}
            stepIndex={extractStepIndex}
            stepTotal={extractStepTotal}
            activePageCount={extractActivePageCount}
            activePending={extractActivePending}
          />
        )}

        {afterPhase === "error" && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">No pudimos extraer la información</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {extractError || "Ocurrió un error al procesar tus documentos."}
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setAfterPhase("none")}
              >
                Revisar documentos
              </Button>
              <Button
                className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]"
                onClick={() => {
                  setAfterPhase("extractingAnim");
                  void runExtract();
                }}
              >
                Reintentar extracción
              </Button>
            </div>
          </div>
        )}

        {afterPhase === "wizard" && pkg && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Completar datos faltantes</h2>
              <p className="text-sm text-gray-500">
                {computeMissingFields(pkg).length} campo(s) requieren confirmación. El asistente te va a preguntar uno a uno.
              </p>
            </div>
            {extractError && <p className="text-sm text-red-500">{extractError}</p>}
            <ChatWizard package={pkg} missing={computeMissingFields(pkg)} onComplete={onWizardDone} onUpdate={setPkg} />
          </div>
        )}

        {afterPhase === "preview" && pkg && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-[#1a1a1a]">Vista previa y exportación</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAfterPhase("wizard")}
              >
                Volver al asistente
              </Button>
            </div>
            {extractError && <p className="text-sm text-red-500">{extractError}</p>}
            <FormsPreview
              value={pkg}
              onChange={setPkg}
              onGeneratePdf={onGeneratePdf}
              generating={generatingPdf}
              ocrReport={ocrReport}
            />
          </div>
        )}
      </main>
    </div>
  );
}
