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
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IntakeData } from "@/app/onboarding/page";

type DocStatus = "pending" | "uploaded";

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
  onNext: () => void;
  onBack?: () => void;
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (uploaded ? onRemove(doc.id) : inputRef.current?.click())}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          uploaded ? onRemove(doc.id) : inputRef.current?.click();
        }
      }}
      className={`group flex gap-4 p-4 rounded-2xl ring-1 transition-all duration-300 cursor-pointer text-left ${
        uploaded ? "ring-[#BBE795]/40 bg-[#F0FEE6]/40" : "ring-gray-100 bg-white hover:ring-[#BBE795]/30 hover:shadow-sm"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(doc.id, f);
          e.target.value = "";
        }}
      />
      <div
        className={`flex shrink-0 items-center justify-center w-11 h-11 rounded-xl transition-colors ${
          uploaded ? "bg-[#BBE795]/20" : "bg-gray-50 group-hover:bg-[#F0FEE6]"
        }`}
      >
        <Icon className={`w-5 h-5 transition-colors ${uploaded ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"}`} />
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[#1a1a1a]">{doc.title}</p>
          {doc.required && <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Requerido</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <FileText className="w-3 h-3 shrink-0" /> {doc.req}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-semibold shrink-0 transition-colors ${
              uploaded ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"
            }`}
          >
            {uploaded ? (
              <>
                <span className="truncate max-w-[120px]">{doc.file?.name}</span>
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

export function DocumentIngestStep({ intake, onNext, onBack }: Props) {
  const [docs, setDocs] = useState<Doc[]>(INITIAL_DOCS);
  const [newDocName, setNewDocName] = useState("");
  const [showUploader, setShowUploader] = useState(false);

  const onSelect = useCallback((id: string, file: File) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "uploaded" as DocStatus, file } : d)));
  }, []);

  const onRemove = useCallback((id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "pending" as DocStatus, file: undefined } : d)));
  }, []);

  const uploaded = docs.filter((d) => d.status === "uploaded");
  const requiredDone = docs.filter((d) => d.required && d.status === "uploaded").length;
  const requiredTotal = docs.filter((d) => d.required).length;
  const canContinue = requiredDone === requiredTotal;
  const pct = Math.round((uploaded.length / docs.length) * 100);
  const requiredDocs = docs.filter((d) => d.required);
  const optionalDocs = docs.filter((d) => !d.required);

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!showUploader ? (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="flex items-center justify-between">
            {onBack ? (
              <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-gray-700">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              onClick={() => setShowUploader(true)}
              className="rounded-lg px-5 h-9 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] font-semibold gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              Entendido, continuar <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider">Paso 3 · Ingesta</p>
            <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mt-1">Antes de subir documentos</h2>
          </div>

          <div className="rounded-2xl border border-[#dcecd0] bg-[#f8fbf5] px-5 py-5 flex items-start gap-3 animate-in fade-in duration-500">
            <span className="relative mt-0.5 shrink-0">
              <span className="absolute inset-0 rounded-full bg-[#4a7c59]/20 animate-ping" />
              <CheckCircle2 className="relative w-5 h-5 text-[#4a7c59] animate-[pulse_1.4s_ease-in-out_infinite]" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1a1a1a]">Se viene un proceso de carga de información largo.</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tranqui: es la parte más difícil. Cuando tengamos todo, la experiencia será más rápida y te daremos una
                mejor recomendación final de inversión.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        {onBack ? (
          <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-gray-700 justify-center sm:justify-start">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <Button
          id="ingest-next-top"
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className={`rounded-xl px-6 h-10 font-semibold text-sm flex items-center justify-center gap-2 sm:min-w-[200px] transition-all duration-200 ${
            canContinue ? "bg-[#4a7c59] text-white hover:bg-[#3f6b4c] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Siguiente <ChevronRight className="w-4 h-4 shrink-0" />
        </Button>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider">Paso 3 · Ingesta</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Documentación corporativa · {empresa}</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Documentos de la persona jurídica (PDF o imagen). Los obligatorios deben cargarse para continuar.
          {intake.sector.trim() ? (
            <>
              {" "}
              Sector: <span className="font-medium text-[#1a1a1a]">{intake.sector}</span>.
            </>
          ) : null}
        </p>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-4 shadow-sm">
        <div className="flex justify-between gap-4 text-sm mb-2">
          <span className="font-medium text-[#1a1a1a]">Progreso de carga</span>
          <span className={`tabular-nums font-bold shrink-0 ${canContinue ? "text-[#6abf1a]" : "text-gray-400"}`}>{pct}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#BBE795] to-[#7dd83a] transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {requiredDone} de {requiredTotal} obligatorios · {uploaded.length} de {docs.length} archivos
        </p>
      </div>

      {!canContinue && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#f8fbf5] ring-1 ring-[#dcecd0] animate-in fade-in duration-300">
          <span className="shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-[#4a7c59]" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1a1a] leading-snug">Antes de continuar</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Completa la carga de documentos obligatorios. Es la parte más larga del proceso.
            </p>
          </div>
        </div>
      )}

      <details open className="rounded-xl border border-gray-100 bg-white">
        <summary className="list-none cursor-pointer px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Obligatorios ({requiredDocs.length})</p>
          <span className="text-xs text-gray-400">⌄</span>
        </summary>
        <div className="px-4 pb-4 grid gap-3">
          {requiredDocs.map((d) => (
            <DocCard key={d.id} doc={d} onSelect={onSelect} onRemove={onRemove} />
          ))}
        </div>
      </details>

      <details open className="rounded-xl border border-gray-100 bg-white">
        <summary className="list-none cursor-pointer px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Opcionales ({optionalDocs.length})</p>
          <span className="text-xs text-gray-400">⌄</span>
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <div className="flex gap-2">
            <Input
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Agregar documento adicional"
              className="h-9"
            />
            <Button type="button" variant="outline" className="h-9" onClick={addOptionalDoc}>
              Agregar
            </Button>
          </div>
          <div className="grid gap-3">
            {optionalDocs.map((d) => (
              <DocCard key={d.id} doc={d} onSelect={onSelect} onRemove={onRemove} />
            ))}
          </div>
        </div>
      </details>

      {canContinue && (
        <div className="relative flex items-start gap-3 px-4 py-3 rounded-xl bg-[#F0FEE6] ring-1 ring-[#BBE795]/40 animate-in fade-in slide-in-from-bottom-2 duration-400 overflow-hidden">
          <span className="shrink-0 mt-0.5 relative">
            <span className="absolute inset-0 rounded-full animate-ping bg-[#4a7c59]/20" />
            <CheckCircle2 className="relative w-5 h-5 text-[#4a7c59] animate-[bounce_1.2s_ease-in-out_infinite]" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1a1a] leading-snug">Despues de cargar: documentos recibidos correctamente.</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Esta información la usaremos para personalizar tu recomendación final de producto de inversión y completar
              formularios que antes tomaban mucho tiempo.
            </p>
          </div>
        </div>
      )}

      <div className="pt-1" />
        </>
      )}
    </div>
  );
}
