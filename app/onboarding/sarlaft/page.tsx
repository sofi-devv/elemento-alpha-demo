"use client";

import { useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  FileText,
  Building2,
  Receipt,
  CreditCard,
  Users,
  BarChart2,
  Landmark,
  ChevronRight,
  X,
  Loader2,
  ScanLine,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldByFieldForm } from "@/components/sarlaft/FieldByFieldForm";
import { FormsPreview } from "@/components/sarlaft/FormsPreview";
import type { SarlaftPackage, MissingFieldRef } from "@/lib/sarlaft/schema";
import type { OcrReportItem } from "@/lib/sarlaft/ocrTypes";

type Phase = "upload" | "analyzing" | "form" | "preview";

type DocStatus = "pending" | "uploaded";

interface Document {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  requirement: string;
  status: DocStatus;
  file?: File;
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
    description: "Documento que identifique a los socios o accionistas con participación igual o superior al 5%.",
    requirement: "PDF · Firmado por Rep. Legal",
    status: "pending",
  },
  {
    id: "estados",
    icon: BarChart2,
    title: "Estados Financieros",
    description: "Generalmente del último corte anual o del año inmediatamente anterior.",
    requirement: "PDF · Certificados por contador",
    status: "pending",
  },
  {
    id: "renta",
    icon: Landmark,
    title: "Declaración de Renta",
    description: "Copia del último periodo gravable disponible.",
    requirement: "PDF · Último periodo gravable",
    status: "pending",
  },
];

function DocCard({
  doc,
  onFileSelect,
  onRemove,
}: {
  doc: Document;
  onFileSelect: (id: string, file: File) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = doc.icon;
  const isUploaded = doc.status === "uploaded";

  const handleClick = () => {
    if (isUploaded) {
      onRemove(doc.id);
    } else {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(doc.id, file);
    }
    e.target.value = "";
  };

  return (
    <div
      className={`group relative flex gap-4 p-4 rounded-2xl ring-1 transition-all duration-300 cursor-pointer
        ${isUploaded
          ? "ring-[#BBE795]/40 bg-[#F0FEE6]/40 hover:ring-[#BBE795]/60"
          : "ring-gray-100 bg-white hover:ring-[#BBE795]/30 hover:shadow-sm"
        }`}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors duration-300 ${
          isUploaded ? "bg-[#BBE795]/20" : "bg-gray-50 group-hover:bg-[#F0FEE6]"
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-colors duration-300 ${
            isUploaded ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a] leading-snug">{doc.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{doc.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="inline-flex items-center text-[11px] text-gray-400 font-medium gap-1">
            <FileText className="w-3 h-3" />
            {doc.requirement}
          </span>
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
              isUploaded ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"
            }`}
          >
            {isUploaded ? (
              <>
                <span className="truncate max-w-[120px]">{doc.file?.name}</span>
                <X className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Cargar documento</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnalysisProgress {
  currentDoc: string;
  currentIndex: number;
  total: number;
  status: "extracting" | "done";
}

function AnalyzingScreen({ progress }: { progress: AnalysisProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.currentIndex / progress.total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-8 animate-in fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#F0FEE6] flex items-center justify-center mx-auto mb-4 ring-4 ring-[#BBE795]/20">
          <ScanLine className="w-8 h-8 text-[#6abf1a] animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Analizando documentos</h2>
        <p className="text-sm text-gray-500 mt-1">
          La IA está extrayendo información de tus documentos
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Progreso</span>
          <span className="font-semibold text-[#1a1a1a]">{progress.currentIndex} de {progress.total}</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#BBE795] to-[#7dd83a] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100">
          <Loader2 className="w-4 h-4 text-[#6abf1a] animate-spin shrink-0" />
          <p className="text-sm text-gray-600 truncate">
            Procesando: <span className="font-medium">{progress.currentDoc}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SarlaftPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    currentDoc: "",
    currentIndex: 0,
    total: 0,
    status: "extracting",
  });

  const [pkg, setPkg] = useState<SarlaftPackage | null>(null);
  const [missingFields, setMissingFields] = useState<MissingFieldRef[]>([]);
  const [ocrReport, setOcrReport] = useState<OcrReportItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleFileSelect = useCallback((id: string, file: File) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "uploaded" as DocStatus, file } : d
      )
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "pending" as DocStatus, file: undefined } : d
      )
    );
  }, []);

  const uploadedDocs = docs.filter((d) => d.status === "uploaded");
  const canAnalyze = uploadedDocs.length > 0;

  const startAnalysis = useCallback(async () => {
    if (!canAnalyze) return;
    setPhase("analyzing");
    setError(null);

    const formData = new FormData();
    for (const doc of uploadedDocs) {
      if (doc.file) {
        formData.append(doc.id, doc.file);
      }
    }

    setAnalysisProgress({
      currentDoc: "Preparando...",
      currentIndex: 0,
      total: uploadedDocs.length,
      status: "extracting",
    });

    try {
      const res = await fetch("/api/sarlaft/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No se pudo leer la respuesta");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "doc_start") {
              setAnalysisProgress({
                currentDoc: msg.fileName,
                currentIndex: msg.index,
                total: msg.total,
                status: "extracting",
              });
            } else if (msg.type === "doc_done") {
              setAnalysisProgress((prev) => ({ ...prev, currentIndex: prev.currentIndex }));
            } else if (msg.type === "complete") {
              setPkg(msg.package);
              setMissingFields(msg.missing || []);
              setOcrReport(msg.ocrReport || null);
              setPhase(msg.missing?.length > 0 ? "form" : "preview");
            } else if (msg.type === "error") {
              throw new Error(msg.message);
            }
          } catch (parseErr) {
            console.warn("Error parsing stream line:", parseErr);
          }
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setPhase("upload");
    }
  }, [canAnalyze, uploadedDocs]);

  const handleFormComplete = useCallback((updatedPkg: SarlaftPackage) => {
    setPkg(updatedPkg);
    setPhase("preview");
  }, []);

  const handlePackageUpdate = useCallback((updatedPkg: SarlaftPackage) => {
    setPkg(updatedPkg);
  }, []);

  const handleGeneratePdf = useCallback(async () => {
    if (!pkg) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/sarlaft/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg }),
      });
      if (!res.ok) throw new Error("Error generando PDFs");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sarlaft-formularios.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setGenerating(false);
    }
  }, [pkg]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
            </Link>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Onboarding · {phase === "upload" ? "Fase 1" : phase === "analyzing" ? "Fase 2" : phase === "form" ? "Fase 3" : "Completado"}
              </p>
              <h1 className="text-base font-semibold text-[#1a1a1a] leading-tight">
                Procedimiento SARLAFT
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {phase === "upload" && (
              <>
                <span className="font-semibold text-[#1a1a1a]">{uploadedDocs.length}</span>
                <span>de {docs.length} documentos</span>
              </>
            )}
            {phase === "analyzing" && (
              <div className="flex items-center gap-2 text-blue-500 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando...
              </div>
            )}
            {phase === "form" && (
              <div className="flex items-center gap-2 text-[#6abf1a] font-medium">
                <Sparkles className="w-4 h-4" />
                Completar datos
              </div>
            )}
            {phase === "preview" && (
              <div className="flex items-center gap-2 text-[#6abf1a] font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Listo para exportar
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Upload Phase */}
        {phase === "upload" && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-[#6abf1a]" />
                <span className="text-sm font-semibold text-[#6abf1a] uppercase tracking-wider">
                  Vinculación Empresarial
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-2">
                Carga tus documentos
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                Sube los documentos requeridos. La IA analizará automáticamente su contenido
                para completar los formularios SARLAFT.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 ring-1 ring-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#1a1a1a]">Progreso de carga</span>
                <span className={`text-sm font-bold ${canAnalyze ? "text-[#6abf1a]" : "text-gray-400"}`}>
                  {Math.round((uploadedDocs.length / docs.length) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[#BBE795] to-[#7dd83a]"
                  style={{ width: `${(uploadedDocs.length / docs.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {uploadedDocs.length === 0
                  ? "Sube al menos un documento para continuar"
                  : `${uploadedDocs.length} documento${uploadedDocs.length !== 1 ? "s" : ""} cargado${uploadedDocs.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="grid gap-3 mb-8">
              {docs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onFileSelect={handleFileSelect}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-white ring-1 ring-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  {canAnalyze ? "¡Listo para analizar!" : "Carga al menos un documento"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 max-w-sm">
                  {canAnalyze
                    ? "La IA extraerá la información automáticamente."
                    : "Puedes subir los documentos que tengas disponibles."}
                </p>
              </div>
              <Button
                disabled={!canAnalyze}
                onClick={startAnalysis}
                className={`flex items-center gap-2 font-semibold transition-all duration-300 ${
                  canAnalyze
                    ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Analizar con IA
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* Analyzing Phase */}
        {phase === "analyzing" && (
          <AnalyzingScreen progress={analysisProgress} />
        )}

        {/* Form Phase */}
        {phase === "form" && pkg && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#6abf1a]" />
                <span className="text-sm font-semibold text-[#6abf1a] uppercase tracking-wider">
                  Análisis completado
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-2">
                Completa la información faltante
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                La IA extrajo la mayor parte de los datos. Completa los campos que no pudieron
                ser identificados automáticamente.
              </p>
            </div>

            <FieldByFieldForm
              package={pkg}
              missing={missingFields}
              onComplete={handleFormComplete}
              onUpdate={handlePackageUpdate}
            />
          </div>
        )}

        {/* Preview Phase */}
        {phase === "preview" && pkg && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#6abf1a]" />
                <span className="text-sm font-semibold text-[#6abf1a] uppercase tracking-wider">
                  Formularios completos
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-2">
                Vista previa y exportación
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                Revisa los formularios generados y descarga el paquete PDF cuando estés listo.
              </p>
            </div>

            <FormsPreview
              value={pkg}
              onChange={handlePackageUpdate}
              onGeneratePdf={handleGeneratePdf}
              generating={generating}
              ocrReport={ocrReport}
            />
          </div>
        )}
      </main>
    </div>
  );
}
