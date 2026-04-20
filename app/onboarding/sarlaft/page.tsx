"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
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
  ShieldCheck,
  ScanLine,
  Database,
} from "lucide-react";
import Link from "next/link";

type DocStatus = "pending" | "uploaded" | "reviewing" | "approved";

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
    id: "sarlaft",
    icon: FileText,
    title: "Formulario de Vinculación SARLAFT",
    description:
      "Debidamente diligenciado y firmado por el representante legal.",
    requirement: "PDF · Firmado",
    status: "pending",
  },
  {
    id: "camara",
    icon: Building2,
    title: "Certificado de Existencia y Representación Legal",
    description:
      "Expedido por la Cámara de Comercio con vigencia no mayor a 90 días.",
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
    description:
      "Documento que identifique a los socios o accionistas con participación igual o superior al 5% (Beneficiario Final).",
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
  reviewing: {
    label: "En revisión",
    color: "border-amber-300 text-amber-500",
    icon: AlertCircle,
  },
  approved: {
    label: "Aprobado",
    color: "bg-[#BBE795] text-[#1a1a1a] border-transparent",
    icon: CheckCircle2,
  },
};

function DocCard({
  doc,
  onToggle,
}: {
  doc: Document;
  onToggle: (id: string) => void;
}) {
  const config = statusConfig[doc.status];
  const Icon = doc.icon;
  const StatusIco = config.icon;
  const isUploaded = doc.status !== "pending";

  return (
    <div
      className={`group relative flex gap-4 p-4 rounded-2xl ring-1 transition-all duration-300 cursor-pointer
        ${isUploaded
          ? "ring-[#BBE795]/40 bg-[#F0FEE6]/40 hover:ring-[#BBE795]/60"
          : "ring-gray-100 bg-white hover:ring-[#BBE795]/30 hover:shadow-sm"
        }`}
      onClick={() => onToggle(doc.id)}
    >
      {/* Icon */}
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

      {/* Content */}
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
            {config.label}
          </Badge>
        </div>

        {/* Requirement tag + Upload action */}
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
                <span>Documento cargado</span>
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

// ── Reglas SARLAFT que se validan por documento ────────────────────────────
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

// ── Pantalla de verificación animada ─────────────────────────────────────────
function VerificationScreen({ docs }: { docs: Document[] }) {
  const [currentDocIdx, setCurrentDocIdx] = useState(0);
  const [phase, setPhase] = useState<"scanning" | "checking" | "approved">("scanning");
  const [rulesVisible, setRulesVisible] = useState(0);
  const [approvedDocs, setApprovedDocs] = useState<number[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [scanPos, setScanPos] = useState(0);

  // Scan line animation
  useEffect(() => {
    if (phase !== "scanning") { setScanPos(0); return; }
    const interval = setInterval(() => {
      setScanPos((p) => (p >= 100 ? 0 : p + 2));
    }, 18);
    return () => clearInterval(interval);
  }, [phase]);

  // State machine
  useEffect(() => {
    if (allDone) return;
    const rules = getRulesForDoc(currentDocIdx);

    if (phase === "scanning") {
      const t = setTimeout(() => setPhase("checking"), 1400);
      return () => clearTimeout(t);
    }
    if (phase === "checking") {
      if (rulesVisible < rules.length) {
        const t = setTimeout(() => setRulesVisible((r) => r + 1), 650);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("approved"), 500);
      return () => clearTimeout(t);
    }
    if (phase === "approved") {
      const t = setTimeout(() => {
        setApprovedDocs((prev) => [...prev, currentDocIdx]);
        const next = currentDocIdx + 1;
        if (next >= docs.length) {
          setAllDone(true);
        } else {
          setCurrentDocIdx(next);
          setPhase("scanning");
          setRulesVisible(0);
        }
      }, 900);
      return () => clearTimeout(t);
    }
  }, [phase, rulesVisible, currentDocIdx, docs.length, allDone]);

  const currentDoc = docs[currentDocIdx];
  const CurrentIcon = currentDoc?.icon ?? FileText;
  const rules = getRulesForDoc(currentDocIdx);

  if (allDone) {
    return (
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-10 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 rounded-full bg-[#BBE795] flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(187,231,149,0.5)]">
          <ShieldCheck className="w-10 h-10 text-[#1a1a1a]" />
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Validación SARLAFT completada</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-2">
          Los <strong>{docs.length} documentos</strong> fueron validados contra las listas restrictivas internacionales y la normativa colombiana de prevención de lavado de activos.
        </p>
        <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
          Esta validación emplea procesamiento NLP con revisión <em>Human-in-the-Loop</em> para garantizar cumplimiento regulatorio.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-8 max-w-sm mx-auto">
          {SARLAFT_RULES.slice(0, 6).map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-xs text-left bg-[#F0FEE6] rounded-lg px-3 py-2 ring-1 ring-[#BBE795]/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#6abf1a] shrink-0" />
              <span className="text-gray-600 font-medium">{r.db}</span>
            </div>
          ))}
        </div>
        <Link href="/">
          <Button className="bg-[#1a1a1a] text-white hover:bg-black shadow-lg font-semibold">
            Volver al panel principal
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Encabezado de progreso */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest mb-0.5">Verificación SARLAFT</p>
          <h2 className="text-lg font-bold text-[#1a1a1a]">
            Documento {currentDocIdx + 1} de {docs.length}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full ring-1 ring-blue-100">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          En proceso
        </div>
      </div>

      {/* Animación principal: Documento ↔ SARLAFT */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center min-h-[260px]">

          {/* ── Panel izquierdo: Documento ── */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documentación</p>
            <div className="relative w-full max-w-[180px] mx-auto">
              {/* Documento visual */}
              <div className={`relative rounded-xl overflow-hidden border-2 transition-all duration-500 ${
                phase === "approved" ? "border-[#BBE795] shadow-[0_0_20px_rgba(187,231,149,0.4)]" : "border-gray-200"
              } bg-white p-4 min-h-[180px]`}>
                {/* Scan line */}
                {phase === "scanning" && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#6abf1a] to-transparent opacity-80 transition-none z-10"
                    style={{ top: `${scanPos}%` }}
                  />
                )}
                {/* Document content mockup */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-3 mx-auto transition-colors duration-500 ${
                  phase === "approved" ? "bg-[#BBE795]" : "bg-gray-100"
                }`}>
                  <CurrentIcon className={`w-5 h-5 transition-colors duration-500 ${
                    phase === "approved" ? "text-[#1a1a1a]" : "text-gray-400"
                  }`} />
                </div>
                <div className="space-y-1.5">
                  {[100, 75, 90, 60, 80].map((w, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-colors duration-500 ${
                        phase === "scanning" && scanPos > i * 20
                          ? "bg-[#BBE795]/60"
                          : phase === "approved"
                          ? "bg-[#BBE795]/40"
                          : "bg-gray-100"
                      }`}
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
                {/* Approved badge */}
                {phase === "approved" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#F0FEE6]/80 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-8 h-8 text-[#6abf1a]" />
                      <span className="text-xs font-bold text-[#6abf1a]">Aprobado</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-center text-gray-500 mt-2 font-medium leading-snug">{currentDoc?.title}</p>
            </div>
          </div>

          {/* ── Centro: flujo animado ── */}
          <div className="flex flex-col items-center gap-1 px-1">
            {["↔", "↔", "↔"].map((_, i) => (
              <div
                key={i}
                className={`w-px h-5 rounded-full transition-all duration-300 ${
                  phase === "checking" ? "bg-[#BBE795]" : "bg-gray-200"
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
            <div className={`my-1 rounded-full p-1.5 transition-all duration-500 ${
              phase === "checking" ? "bg-[#BBE795]/20 ring-1 ring-[#BBE795]/40" : "bg-gray-50"
            }`}>
              <Database className={`w-4 h-4 transition-colors duration-300 ${
                phase === "checking" ? "text-[#6abf1a]" : "text-gray-300"
              }`} />
            </div>
            {["↔", "↔", "↔"].map((_, i) => (
              <div
                key={i}
                className={`w-px h-5 rounded-full transition-all duration-300 ${
                  phase === "checking" ? "bg-[#BBE795]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* ── Panel derecho: Reglas SARLAFT ── */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SARLAFT</p>
            {rules.map((rule, i) => {
              const visible = i < rulesVisible || phase === "approved";
              const approved = phase === "approved" || i < rulesVisible;
              return (
                <div
                  key={rule.label}
                  className={`transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
                >
                  <div className={`flex items-start gap-2 p-2.5 rounded-xl ring-1 transition-all duration-300 ${
                    approved
                      ? "bg-[#F0FEE6] ring-[#BBE795]/40"
                      : visible
                      ? "bg-blue-50 ring-blue-100"
                      : "bg-gray-50 ring-gray-100"
                  }`}>
                    <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                      approved ? "bg-[#BBE795]" : "bg-blue-100"
                    }`}>
                      {approved
                        ? <CheckCircle2 className="w-2.5 h-2.5 text-[#1a1a1a]" />
                        : <Loader2 className="w-2.5 h-2.5 text-blue-500 animate-spin" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#1a1a1a] leading-snug">{rule.label}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{rule.db}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Reglas pendientes (placeholders) */}
            {phase === "scanning" && (
              <div className="space-y-2 mt-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-50 ring-1 ring-gray-100 animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Barra de estado inferior */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <ScanLine className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
            phase === "scanning" ? "text-[#6abf1a] animate-pulse" : phase === "checking" ? "text-blue-400" : "text-[#6abf1a]"
          }`} />
          <p className="text-xs text-gray-500 font-medium">
            {phase === "scanning" && "Escaneando documento y extrayendo metadatos..."}
            {phase === "checking" && `Cruzando con bases de datos SARLAFT — ${rulesVisible}/${rules.length} verificaciones`}
            {phase === "approved" && "✓ Documento validado exitosamente"}
          </p>
        </div>
      </div>

      {/* Documentos ya verificados */}
      {approvedDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Verificados</p>
          <div className="grid gap-2">
            {approvedDocs.map((idx) => {
              const d = docs[idx];
              const Icon = d.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[#F0FEE6]/60 ring-1 ring-[#BBE795]/30 animate-in fade-in duration-500">
                  <div className="w-7 h-7 rounded-lg bg-[#BBE795] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#1a1a1a]" />
                  </div>
                  <p className="text-xs font-semibold text-[#1a1a1a] flex-1 min-w-0 truncate">{d.title}</p>
                  <CheckCircle2 className="w-4 h-4 text-[#6abf1a] shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SarlaftPage() {
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedIndex, setVerifiedIndex] = useState(-1);

  // Verification animation logic
  useEffect(() => {
    if (isVerifying && verifiedIndex < docs.length) {
      const timer = setTimeout(() => {
        setVerifiedIndex((prev) => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isVerifying, verifiedIndex, docs.length]);

  const toggleDoc = (id: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: d.status === "pending" ? "uploaded" : "pending" }
          : d
      )
    );
  };

  const uploaded = docs.filter((d) => d.status !== "pending").length;
  const total = docs.length;
  const progress = Math.round((uploaded / total) * 100);
  const allDone = uploaded === total;
  const isFinished = verifiedIndex >= docs.length;

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
                Onboarding · Fase 1
              </p>
              <h1 className="text-base font-semibold text-[#1a1a1a] leading-tight">
                Procedimiento SARLAFT
              </h1>
            </div>
          </div>
          {!isVerifying ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-semibold text-[#1a1a1a]">{uploaded}</span>
              <span>de {total} documentos</span>
            </div>
          ) : !isFinished ? (
            <div className="flex items-center gap-2 text-sm text-blue-500 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#6abf1a] font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verificación completada</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {!isVerifying ? (
          <>
            {/* Hero */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-[#6abf1a]" />
                <span className="text-sm font-semibold text-[#6abf1a] uppercase tracking-wider">
                  Vinculación Empresarial
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-2">
                Documentos requeridos
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                Para cumplir con la normativa SARLAFT, carga los siguientes
                documentos. Todos los archivos deben estar vigentes y ser legibles.
              </p>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  Progreso de carga
                </span>
                <span
                  className={`text-sm font-bold ${
                    allDone ? "text-[#6abf1a]" : "text-gray-400"
                  }`}
                >
                  {progress}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[#BBE795] to-[#7dd83a]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {allDone
                  ? "✓ Todos los documentos han sido cargados"
                  : `${total - uploaded} documento${total - uploaded !== 1 ? "s" : ""} pendiente${total - uploaded !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Document Cards */}
            <div className="grid gap-3 mb-8">
              {docs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onToggle={toggleDoc} />
              ))}
            </div>

            {/* Footer CTA */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white ring-1 ring-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  {allDone ? "¡Listo para revisar!" : "Completa todos los documentos"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 max-w-sm">
                  {allDone
                    ? "Iniciará una validación automática estructurada con IA."
                    : `Faltan ${total - uploaded} de ${total} documentos para continuar.`}
                </p>
              </div>
              <Button
                disabled={!allDone}
                onClick={() => setIsVerifying(true)}
                className={`flex items-center gap-2 font-semibold transition-all duration-300 ${
                  allDone
                    ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Iniciar verificación estructurada
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <VerificationScreen docs={docs} />
        )}
      </main>
    </div>
  );
}
