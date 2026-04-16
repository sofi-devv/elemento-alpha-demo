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

export default function SarlaftPage() {
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedIndex, setVerifiedIndex] = useState(-1);

  // Verification animation logic
  useEffect(() => {
    if (isVerifying && verifiedIndex < docs.length) {
      const timer = setTimeout(() => {
        setVerifiedIndex((prev) => prev + 1);
      }, 700); // Verify one doc every 700ms
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
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-8 flex items-center gap-3">
              Verificando documentos
              {!isFinished && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            </h2>
            <div className="space-y-5 mb-8">
              {docs.map((doc, idx) => {
                const isVerified = idx < verifiedIndex;
                const isCurrent = idx === verifiedIndex;
                const isWaiting = idx > verifiedIndex;

                return (
                  <div key={doc.id} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isVerified
                          ? "bg-[#BBE795] text-[#1a1a1a]"
                          : isCurrent
                          ? "bg-blue-50 text-blue-500"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold transition-colors duration-300 ${
                          isVerified
                            ? "text-[#1a1a1a]"
                            : isCurrent
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      >
                        {isVerified
                          ? `Requisito verificado: ${doc.title}`
                          : isCurrent
                          ? `Evaluando ${doc.title}...`
                          : `En espera: ${doc.title}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={`transition-all duration-700 overflow-hidden ${
                isFinished ? "max-h-96 opacity-100 mt-8" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-5 rounded-xl bg-[#F0FEE6] ring-1 ring-[#BBE795]/40 mb-6">
                <p className="text-sm text-[#1a1a1a] leading-relaxed">
                  <strong className="text-[#6abf1a] font-bold block mb-1">
                    Validación automática completada exitosamente.
                  </strong>
                  Nuestra validación funciona utilizando procesamiento de lenguaje
                  natural (NLP) para contrastar los documentos frente a las normativas
                  de SARLAFT. Esta validación híbrida es automática y cuenta con la
                  revisión de nuestro modelo <i>Human-In-The-Loop</i> para garantizar
                  el 100% de precisión.
                </p>
              </div>
              <div className="flex justify-end">
                <Link href="/">
                  <Button className="bg-[#1a1a1a] text-white hover:bg-black shadow-lg font-semibold">
                    Volver al panel principal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
