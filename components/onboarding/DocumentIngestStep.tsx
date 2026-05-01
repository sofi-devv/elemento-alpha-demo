"use client";

import { useState, useRef, useCallback } from "react";
import {
  Building2,
  Receipt,
  Users,
  BarChart2,
  Landmark,
  FileText,
  Upload,
  X,
  ArrowLeft,
  CheckCircle2,
  Plus,
  CreditCard,
  Loader2,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IntakeData } from "@/app/onboarding/page";
import { createEmptyPackage, type MissingFieldRef, type SarlaftPackage } from "@/lib/sarlaft/schema";
import { computeMissingFields } from "@/lib/sarlaft/missingFields";
import type { OcrReportItem } from "@/lib/sarlaft/ocrTypes";

type DocStatus = "pending" | "uploaded";

type Phase = "idle" | "analyzing";

/** Claves reconocidas por `/api/sarlaft/extract` */
const SARLAFT_FORM_KEYS = new Set(["camara", "rut", "cedula", "accionaria", "estados", "renta"]);

interface Doc {
  id: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  req: string;
  status: DocStatus;
  file?: File;
  required: boolean;
}

const INITIAL_DOCS: Doc[] = [
  {
    id: "rut",
    icon: Receipt,
    title: "RUT",
    desc: "Registro Único Tributario actualizado.",
    req: "PDF · Actualizado",
    status: "pending",
    required: true,
  },
  {
    id: "camara",
    icon: Building2,
    title: "Cámara de Comercio",
    desc: "Certificado de existencia con vigencia ≤ 90 días.",
    req: "PDF · Vigencia 90 días",
    status: "pending",
    required: true,
  },
  {
    id: "cedula",
    icon: CreditCard,
    title: "Cédula del representante legal",
    desc: "Opcional aquí si ya la tienes; también podrás cargarla en el paso KYC.",
    req: "PDF o imagen",
    status: "pending",
    required: false,
  },
  {
    id: "estados",
    icon: BarChart2,
    title: "Estados financieros",
    desc: "Último corte anual certificado por contador.",
    req: "PDF · Certificados",
    status: "pending",
    required: false,
  },
  {
    id: "accionaria",
    icon: Users,
    title: "Composición accionaria",
    desc: "Socios con participación ≥ 5%.",
    req: "PDF · Firmado",
    status: "pending",
    required: false,
  },
  {
    id: "renta",
    icon: Landmark,
    title: "Declaración de renta",
    desc: "Último periodo gravable.",
    req: "PDF · Último periodo",
    status: "pending",
    required: false,
  },
];

interface Props {
  intake: IntakeData;
  /** Después del análisis IA (o al omitir), devuelve paquete y metadatos al padre. */
  onContinue: (payload: {
    package: SarlaftPackage;
    missing: MissingFieldRef[];
    ocrReport: OcrReportItem[] | null;
  }) => void;
  onBack?: () => void;
}

interface AnalysisProgress {
  currentDoc: string;
  currentIndex: number;
  total: number;
}

function AnalyzingScreen({ progress }: { progress: AnalysisProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.currentIndex / progress.total) * 100) : 0;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm animate-in fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#F0FEE6] flex items-center justify-center mx-auto mb-4 ring-4 ring-[#BBE795]/20">
          <ScanLine className="w-8 h-8 text-[#6abf1a] animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Analizando documentos SARLAFT</h2>
        <p className="text-sm text-gray-500 mt-1">Extraemos datos para tus formularios regulatorios</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Progreso</span>
          <span className="font-semibold text-[#1a1a1a]">
            {progress.currentIndex} de {progress.total}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#BBE795] to-[#7dd83a] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <Loader2 className="w-4 h-4 text-[#6abf1a] animate-spin shrink-0" />
          <p className="text-sm text-gray-600 truncate">
            Procesando: <span className="font-medium">{progress.currentDoc}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function DocCard({
  doc,
  onSelect,
  onRemove,
}: {
  doc: Doc;
  onSelect: (id: string, f: File) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = doc.icon;
  const uploaded = doc.status === "uploaded";

  const trigger = () => (uploaded ? onRemove(doc.id) : inputRef.current?.click());

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={trigger}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trigger();
        }
      }}
      className={`group flex gap-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer text-left ${
        uploaded
          ? "border-[#BBE795] bg-[#F0FEE6]/40"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(doc.id, f);
          e.target.value = "";
        }}
      />
      <div
        className={`flex shrink-0 items-center justify-center w-11 h-11 rounded-md transition-colors ${
          uploaded ? "bg-[#BBE795]/30" : "bg-gray-50 group-hover:bg-[#F0FEE6]"
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-colors ${
            uploaded ? "text-[#4a7c59]" : "text-gray-400 group-hover:text-[#4a7c59]"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[#1a1a1a]">{doc.title}</p>
          {doc.required && (
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Requerido</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <FileText className="w-3 h-3 shrink-0" /> {doc.req}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-semibold shrink-0 transition-colors ${
              uploaded ? "text-[#4a7c59]" : "text-gray-500 group-hover:text-[#4a7c59]"
            }`}
          >
            {uploaded ? (
              <>
                <span className="truncate max-w-[140px]">{doc.file?.name}</span>
                <X className="w-3.5 h-3.5 shrink-0" />
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Cargar</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DocumentIngestStep({ intake, onContinue, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    currentDoc: "",
    currentIndex: 0,
    total: 0,
  });

  const [docs, setDocs] = useState<Doc[]>(INITIAL_DOCS);
  const [newDocName, setNewDocName] = useState("");

  const onSelect = useCallback((id: string, file: File) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "uploaded" as DocStatus, file } : d)));
  }, []);

  const onRemove = useCallback((id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "pending" as DocStatus, file: undefined } : d))
    );
  }, []);

  const uploaded = docs.filter((d) => d.status === "uploaded");
  const requiredDocs = docs.filter((d) => d.required);
  const optionalDocs = docs.filter((d) => !d.required);
  const requiredDone = requiredDocs.filter((d) => d.status === "uploaded").length;
  const requiredTotal = requiredDocs.length;
  const canContinue = requiredDone === requiredTotal;
  const requiredPct = Math.round((requiredDone / requiredTotal) * 100);

  const addOptionalDoc = () => {
    const trimmed = newDocName.trim();
    if (!trimmed) return;
    const safeId = `custom-${Date.now()}`;
    setDocs((prev) => [
      ...prev,
      {
        id: safeId,
        icon: FileText,
        title: trimmed,
        desc: "Documento adicional editable.",
        req: "PDF o imagen",
        status: "pending",
        required: false,
      },
    ]);
    setNewDocName("");
  };

  const empresa = intake.empresa.trim() || "tu empresa";

  const uploadedForExtract = docs.filter(
    (d) => d.status === "uploaded" && d.file && SARLAFT_FORM_KEYS.has(d.id)
  );

  const runExtract = useCallback(async () => {
    if (uploadedForExtract.length === 0 || !canContinue) return;
    setPhase("analyzing");
    setExtractError(null);

    const formData = new FormData();
    for (const doc of uploadedForExtract) {
      if (doc.file) formData.append(doc.id, doc.file);
    }

    setAnalysisProgress({
      currentDoc: "Preparando…",
      currentIndex: 0,
      total: uploadedForExtract.length,
    });

    try {
      const res = await fetch("/api/sarlaft/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No se pudo leer la respuesta");

      const decoder = new TextDecoder();
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let msg: {
            type: string;
            fileName?: string;
            index?: number;
            total?: number;
            package?: SarlaftPackage;
            missing?: MissingFieldRef[];
            ocrReport?: OcrReportItem[] | null;
            message?: string;
          };
          try {
            msg = JSON.parse(line) as typeof msg;
          } catch {
            console.warn("Línea NDJSON inválida:", line.slice(0, 80));
            continue;
          }
          if (msg.type === "doc_start") {
            setAnalysisProgress({
              currentDoc: msg.fileName || "Documento",
              currentIndex: msg.index ?? 0,
              total: msg.total ?? uploadedForExtract.length,
            });
          } else if (msg.type === "complete" && msg.package) {
            onContinue({
              package: msg.package,
              missing: msg.missing ?? [],
              ocrReport: msg.ocrReport ?? null,
            });
            setPhase("idle");
            return;
          } else if (msg.type === "error") {
            throw new Error(msg.message || "Error en extracción");
          }
        }
      }
      throw new Error("La extracción terminó sin resultado");
    } catch (err) {
      console.error(err);
      setExtractError(err instanceof Error ? err.message : "Error desconocido");
      setPhase("idle");
    }
  }, [uploadedForExtract, canContinue, onContinue]);

  const continueWithoutAnalysis = useCallback(() => {
    const empty = createEmptyPackage();
    onContinue({
      package: empty,
      missing: computeMissingFields(empty),
      ocrReport: null,
    });
  }, [onContinue]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between">
        {onBack ? (
          <Button
            variant="ghost"
            onClick={onBack}
            className="h-9 px-0 text-gray-500"
            disabled={phase === "analyzing"}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
          </Button>
        ) : (
          <span />
        )}
        <Button
          id="ingest-next-top"
          type="button"
          onClick={runExtract}
          disabled={!canContinue || phase === "analyzing" || uploadedForExtract.length === 0}
          className={`h-9 px-5 rounded-lg font-semibold gap-1.5 transition-all duration-200 ${
            canContinue && uploadedForExtract.length > 0 && phase !== "analyzing"
              ? "bg-[#4a7c59] text-white hover:bg-[#3f6b4c] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {phase === "analyzing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analizando…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Continuar con IA
            </>
          )}
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-1">Paso 3 · Ingesta</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
          Documentación corporativa
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xl">
          Sube los documentos de <span className="font-medium text-[#1a1a1a]">{empresa}</span>
          {intake.sector.trim() ? <> · sector <span className="font-medium text-[#1a1a1a]">{intake.sector}</span></> : null}.
          Al continuar analizamos con IA los archivos estándar (RUT, cámara, etc.) para adelantar tus
          formularios SARLAFT. Los marcados como requeridos son obligatorios para avanzar.
        </p>
      </header>

      {extractError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 space-y-2">
          <p>{extractError}</p>
          <Button type="button" variant="outline" size="sm" className="border-red-300" onClick={continueWithoutAnalysis}>
            Continuar sin análisis IA
          </Button>
        </div>
      )}

      {phase === "analyzing" && <AnalyzingScreen progress={analysisProgress} />}

      {phase === "idle" && (
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium text-[#1a1a1a]">
            Documentos requeridos
          </span>
          <span
            className={`tabular-nums font-bold shrink-0 ${
              canContinue ? "text-[#4a7c59]" : "text-gray-500"
            }`}
          >
            {requiredDone} / {requiredTotal}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#BBE795] to-[#4a7c59] transition-all duration-700"
            style={{ width: `${requiredPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {canContinue ? (
            <span className="inline-flex items-center gap-1.5 text-[#4a7c59] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Listo para continuar.
              Esta información personaliza tu recomendación de inversión y completa los formularios regulatorios.
            </span>
          ) : (
            <>Completa los obligatorios para avanzar. {uploaded.length} archivo{uploaded.length === 1 ? "" : "s"} cargado{uploaded.length === 1 ? "" : "s"} en total.</>
          )}
        </p>
      </div>
      )}

      {phase === "idle" && (
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
            Obligatorios
          </p>
          <span className="text-[11px] text-gray-400 tabular-nums">{requiredDone}/{requiredTotal}</span>
        </div>
        <div className="grid gap-3">
          {requiredDocs.map((d) => (
            <DocCard key={d.id} doc={d} onSelect={onSelect} onRemove={onRemove} />
          ))}
        </div>
      </section>
      )}

      {phase === "idle" && (
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Opcionales</p>
          <span className="text-[11px] text-gray-400 tabular-nums">
            {optionalDocs.filter((d) => d.status === "uploaded").length}/{optionalDocs.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOptionalDoc();
              }
            }}
            placeholder="Agregar documento adicional"
            className="h-9"
          />
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={addOptionalDoc}
            disabled={!newDocName.trim()}
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </Button>
        </div>
        <div className="grid gap-3">
          {optionalDocs.map((d) => (
            <DocCard key={d.id} doc={d} onSelect={onSelect} onRemove={onRemove} />
          ))}
        </div>
      </section>
      )}

      {phase === "idle" && (
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Tip: solo los documentos con tipo reconocido (RUT, cámara, cédula RL, accionariado, estados,
          renta) se envían al motor de extracción. Los adjuntos personalizados sirven como respaldo pero no
          se analizan automáticamente en este paso.
        </p>
      )}
    </div>
  );
}
