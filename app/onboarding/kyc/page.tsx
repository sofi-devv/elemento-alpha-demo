"use client";

import { useState, useCallback } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  BarChart2,
  MessageSquare,
  Square,
  RefreshCw,
  Wallet,
  ShoppingCart,
  Clock,
  Shield,
  Zap,
  Calendar,
  Leaf,
  Upload,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceAgent, type PortfolioRecommendation } from "@/hooks/useVoiceAgent";

// ── Tipos ───────────────────────────────────────────────────────────────────
type Phase = "upload" | "intro" | "kyc" | "risk" | "done";

interface KycData {
  nombres: string;
  apellidos: string;
  tipoDoc: string;
  numDoc: string;
  fechaNac: string;
  email: string;
  celular: string;
}

interface Option {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  activeRing: string;
  activeBg: string;
}

// ── Opciones ────────────────────────────────────────────────────────────────
const RISK_OPTIONS: Option[] = [
  {
    id: "conservador",
    label: "Conservador",
    description: "Prefiero seguridad y estabilidad, aunque la rentabilidad sea menor.",
    icon: TrendingDown,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    activeRing: "ring-blue-300",
    activeBg: "bg-blue-50/60",
  },
  {
    id: "moderado",
    label: "Moderado",
    description: "Acepto cierta variabilidad a cambio de un mejor rendimiento.",
    icon: BarChart2,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    activeRing: "ring-amber-300",
    activeBg: "bg-amber-50/60",
  },
  {
    id: "agresivo",
    label: "Agresivo",
    description: "Busco la mayor rentabilidad posible, asumiendo mayor riesgo.",
    icon: TrendingUp,
    iconColor: "text-[#6abf1a]",
    iconBg: "bg-[#F0FEE6]",
    activeRing: "ring-[#BBE795]",
    activeBg: "bg-[#F0FEE6]/80",
  },
];

const MARKET_UP_OPTIONS: Option[] = [
  {
    id: "reinvierto",
    label: "Reinvierto más",
    description: "Aprovecho el momentum para aumentar mi posición.",
    icon: TrendingUp,
    iconColor: "text-[#6abf1a]",
    iconBg: "bg-[#F0FEE6]",
    activeRing: "ring-[#BBE795]",
    activeBg: "bg-[#F0FEE6]/80",
  },
  {
    id: "mantengo_up",
    label: "Me mantengo",
    description: "Dejo la inversión como está y observo la tendencia.",
    icon: RefreshCw,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    activeRing: "ring-amber-300",
    activeBg: "bg-amber-50/60",
  },
  {
    id: "realizo_ganancia",
    label: "Realizo ganancias",
    description: "Retiro parcialmente para asegurar lo ganado.",
    icon: Wallet,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    activeRing: "ring-blue-300",
    activeBg: "bg-blue-50/60",
  },
];

const MARKET_DOWN_OPTIONS: Option[] = [
  {
    id: "compro_mas",
    label: "Compro más (DCA)",
    description: "Aprovecho el precio bajo para promediar mi inversión.",
    icon: ShoppingCart,
    iconColor: "text-[#6abf1a]",
    iconBg: "bg-[#F0FEE6]",
    activeRing: "ring-[#BBE795]",
    activeBg: "bg-[#F0FEE6]/80",
  },
  {
    id: "espero",
    label: "Espero y observo",
    description: "Me mantengo tranquilo y espero la recuperación del mercado.",
    icon: Clock,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    activeRing: "ring-amber-300",
    activeBg: "bg-amber-50/60",
  },
  {
    id: "retiro",
    label: "Retiro mi inversión",
    description: "Prefiero preservar el capital ante la caída.",
    icon: Shield,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    activeRing: "ring-blue-300",
    activeBg: "bg-blue-50/60",
  },
];

const GROWTH_OPTIONS: Option[] = [
  {
    id: "corto",
    label: "Corto plazo",
    description: "Menos de 1 año. Necesito liquidez y acceso rápido.",
    icon: Zap,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    activeRing: "ring-blue-300",
    activeBg: "bg-blue-50/60",
  },
  {
    id: "mediano",
    label: "Mediano plazo",
    description: "Entre 1 y 3 años. Busco un crecimiento moderado y sostenido.",
    icon: Calendar,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    activeRing: "ring-amber-300",
    activeBg: "bg-amber-50/60",
  },
  {
    id: "largo",
    label: "Largo plazo",
    description: "Más de 3 años. Priorizo el crecimiento sobre la liquidez.",
    icon: Leaf,
    iconColor: "text-[#6abf1a]",
    iconBg: "bg-[#F0FEE6]",
    activeRing: "ring-[#BBE795]",
    activeBg: "bg-[#F0FEE6]/80",
  },
];

// ── Componente: opciones con animación escalonada desde abajo ────────────────
function AnimatedOptions({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: Option[];
  selected: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3">
      {options.map((opt, i) => {
        const Icon = opt.icon;
        const isSelected = selected === opt.id;
        return (
          <div
            key={opt.id}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: `${i * 130}ms`, animationFillMode: "backwards" }}
          >
            <button
              onClick={() => !disabled && onSelect(opt.id)}
              disabled={disabled}
              className={`group flex items-center gap-4 p-4 rounded-xl ring-1 text-left transition-all duration-300 w-full ${
                isSelected
                  ? `${opt.activeBg} ${opt.activeRing}`
                  : "bg-white ring-gray-100 hover:ring-[#BBE795]/40 hover:shadow-sm"
              } disabled:cursor-not-allowed`}
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors duration-300 ${
                  isSelected ? opt.iconBg : "bg-gray-50 group-hover:bg-gray-100"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-300 ${
                    isSelected ? opt.iconColor : "text-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? "text-[#1a1a1a]" : "text-gray-700"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
              </div>
              {isSelected && <CheckCircle2 className="w-5 h-5 text-[#6abf1a] shrink-0" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Datos de portafolios ─────────────────────────────────────────────────────
const PORTFOLIOS: Record<string, {
  color: string; ring: string; bg: string;
  rentabilidad: string; plazoMin: string; liquidez: string; composicion: string;
  tag: string;
}> = {
  conservador: {
    color: "text-blue-600", ring: "ring-blue-200", bg: "bg-blue-50",
    tag: "Bajo riesgo",
    rentabilidad: "5.8% – 7.2% EA", plazoMin: "30 días",
    liquidez: "Diaria", composicion: "100% Renta Fija / Mercado Monetario",
  },
  moderado: {
    color: "text-amber-600", ring: "ring-amber-200", bg: "bg-amber-50",
    tag: "Riesgo moderado",
    rentabilidad: "8.5% – 12% EA", plazoMin: "6 meses",
    liquidez: "Mensual", composicion: "65% Renta Fija / 35% Renta Variable",
  },
  agresivo: {
    color: "text-[#6abf1a]", ring: "ring-[#BBE795]", bg: "bg-[#F0FEE6]",
    tag: "Alto potencial",
    rentabilidad: "14% – 22% EA", plazoMin: "24 meses",
    liquidez: "Trimestral", composicion: "40% Renta Fija / 60% Renta Variable",
  },
};

// ── Propuesta de portafolio ───────────────────────────────────────────────────
function ProposalCard({ rec, onConfirm }: { rec: PortfolioRecommendation; onConfirm: () => void }) {
  const p = PORTFOLIOS[rec.portfolio] ?? PORTFOLIOS.moderado;
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-600">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#6abf1a] uppercase tracking-widest mb-1">
            Propuesta de portafolio · Elemento Alpha
          </p>
          <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">{rec.nombre}</h2>
          <span className={`inline-block mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${p.bg} ${p.color} ring-1 ${p.ring}`}>
            {p.tag}
          </span>
        </div>
        <div className={`flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 ${p.bg} ring-1 ${p.ring}`}>
          <BarChart2 className={`w-7 h-7 ${p.color}`} />
        </div>
      </div>

      {/* Razón */}
      <div className={`p-4 rounded-xl ${p.bg} ring-1 ${p.ring}`}>
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className={`font-semibold ${p.color}`}>Perfil {rec.perfil} · </span>
          {rec.razon}
        </p>
        {rec.monto && rec.monto !== "no especificado" && (
          <p className="text-xs text-gray-500 mt-1">Monto de inversión estimado: <span className="font-semibold text-[#1a1a1a]">{rec.monto}</span></p>
        )}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Rentabilidad esperada", value: p.rentabilidad },
          { label: "Plazo mínimo", value: p.plazoMin },
          { label: "Liquidez", value: p.liquidez },
          { label: "Horizonte", value: rec.plazo },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
            <p className="text-sm font-bold text-[#1a1a1a]">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Composición */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 ring-1 ring-gray-100">
        <BarChart2 className="w-3.5 h-3.5 shrink-0 text-gray-400" />
        <span><span className="font-semibold text-[#1a1a1a]">Composición: </span>{p.composicion}</span>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
          Esta propuesta fue generada a partir del perfilamiento de riesgo y tus estados financieros.
        </p>
        <Button
          onClick={onConfirm}
          className="bg-[#1a1a1a] text-white hover:bg-black shadow-lg font-semibold flex items-center gap-2 shrink-0"
        >
          Aceptar propuesta
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── UI helpers ───────────────────────────────────────────────────────────────
function VoiceDot({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 mx-auto mt-4">
      {speaking && (
        <>
          <span className="absolute inline-flex h-20 w-20 rounded-full bg-[#BBE795]/20 animate-ping" style={{ animationDuration: "1.8s" }} />
          <span className="absolute inline-flex h-14 w-14 rounded-full bg-[#BBE795]/30 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.38s" }} />
        </>
      )}
      <span className={`absolute inline-flex h-14 w-14 rounded-full border-2 transition-all duration-500 ${speaking ? "border-[#BBE795]/80 scale-110" : "border-[#BBE795]/35 scale-100"}`} />
      <span className={`absolute inline-flex h-10 w-10 rounded-full transition-all duration-500 ${speaking ? "bg-[#BBE795]/40 scale-110" : "bg-[#BBE795]/15 scale-100"}`} />
      <span className={`relative inline-flex h-5 w-5 rounded-full bg-[#6abf1a] transition-all duration-300 ${speaking ? "scale-110 shadow-[0_0_16px_rgba(106,191,26,0.65)]" : "scale-100 shadow-[0_0_8px_rgba(106,191,26,0.3)]"}`} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function KycPage() {
  const [phase, setPhase] = useState<Phase>("upload");

  // Upload de estados financieros
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [financialContext, setFinancialContext] = useState<string | undefined>(undefined);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Recomendación de portafolio del agente de voz
  const [portfolioRec, setPortfolioRec] = useState<PortfolioRecommendation | null>(null);

  // Selecciones del perfil de riesgo
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [selectedMarketUp, setSelectedMarketUp] = useState<string | null>(null);
  const [selectedMarketDown, setSelectedMarketDown] = useState<string | null>(null);
  const [selectedGrowth, setSelectedGrowth] = useState<string | null>(null);

  const [kyc, setKyc] = useState<KycData>({
    nombres: "",
    apellidos: "",
    tipoDoc: "CC",
    numDoc: "",
    fechaNac: "",
    email: "",
    celular: "",
  });

  const { startSession, endSession, isConnected, isConnecting, isSpeaking, error } = useVoiceAgent({
    voiceName: "Zephyr",
    financialContext,
    onRecommendation: setPortfolioRec,
  });

  const kycValid =
    kyc.nombres.trim() &&
    kyc.apellidos.trim() &&
    kyc.numDoc.trim() &&
    kyc.fechaNac &&
    kyc.email.trim() &&
    kyc.celular.trim();

  const riskComplete =
    !!selectedRisk && !!selectedMarketUp && !!selectedMarketDown && !!selectedGrowth;

  const advancePhase = () => {
    if (phase === "intro") setPhase("kyc");
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files].slice(0, 2));
    setAnalysisError(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const analyzeFiles = useCallback(async () => {
    if (uploadedFiles.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const formData = new FormData();
      uploadedFiles.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/analyze-financials", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al analizar");
      setFinancialContext(data.summary);
      setPhase("intro");
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadedFiles]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Onboarding · Fase 1
            </p>
            <h1 className="text-base font-semibold text-[#1a1a1a] leading-tight">
              Verificación de Identidad (KYC)
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* ── Upload de Estados Financieros ── */}
        {phase === "upload" && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-5 h-5 text-[#6abf1a]" />
                <span className="text-sm font-semibold text-[#6abf1a] uppercase tracking-wider">
                  Análisis previo
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight mb-1">
                Estados Financieros
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Sube hasta 2 archivos de tus estados financieros (PDF, Excel o imagen). Nuestra IA los analizará para personalizar las recomendaciones del asesor de inversión.
              </p>
            </div>

            {/* Drop zone */}
            <label
              htmlFor="financial-upload"
              className={`group relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                uploadedFiles.length >= 2
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                  : "border-gray-200 hover:border-[#BBE795] hover:bg-[#F0FEE6]/30"
              }`}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-[#F0FEE6] transition-colors duration-300">
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#6abf1a] transition-colors duration-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {uploadedFiles.length >= 2 ? "Máximo 2 archivos" : "Clic para subir o arrastra aquí"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, Excel (.xlsx), PNG, JPG · Máx. 2 archivos</p>
              </div>
              <input
                id="financial-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={uploadedFiles.length >= 2}
              />
            </label>

            {/* File previews */}
            {uploadedFiles.length > 0 && (
              <div className="grid gap-2">
                {uploadedFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F0FEE6]/40 ring-1 ring-[#BBE795]/30 animate-in fade-in duration-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#BBE795]/30 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#6abf1a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {analysisError && (
              <p className="text-sm text-red-500 font-medium">{analysisError}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={() => setPhase("intro")}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Omitir este paso
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                onClick={analyzeFiles}
                disabled={uploadedFiles.length === 0 || isAnalyzing}
                className={`flex items-center gap-2 font-semibold transition-all duration-300 ${
                  uploadedFiles.length > 0 && !isAnalyzing
                    ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    Analizar estados financieros
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Financial context indicator (shows on later phases if uploaded) */}
        {phase !== "upload" && financialContext && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0FEE6]/60 ring-1 ring-[#BBE795]/30 animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-[#6abf1a] shrink-0" />
            <p className="text-xs font-medium text-[#1a1a1a]">
              Estados financieros analizados — el asesor tiene contexto personalizado
            </p>
          </div>
        )}

        {/* ── Voice Agent Card ── */}
        {phase !== "upload" && (
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 px-6 py-10 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Conversación Asistida</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-lg mx-auto">
              Inicia la llamada de voz con la Inteligencia Artificial de Elemento Alpha en tiempo real.
            </p>
          </div>

          <VoiceDot speaking={isSpeaking} />

          <div className="text-center mt-6 mb-8 h-6 flex flex-col justify-center items-center">
            {error ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-semibold uppercase tracking-widest ring-1 ring-red-200">
                Error
              </div>
            ) : isConnecting ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold uppercase tracking-widest ring-1 ring-amber-200">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Conectando...
              </div>
            ) : isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold uppercase tracking-widest ring-1 ring-green-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {isSpeaking ? "HABLANDO · LIVE" : "ESCUCHANDO · LIVE"}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-xs font-semibold uppercase tracking-widest ring-1 ring-gray-200">
                Desconectado
              </div>
            )}
          </div>

          {error && (
            <p className="text-center text-sm text-red-500 mb-4">{error}</p>
          )}

          <div className="flex justify-center gap-3">
            {isConnecting ? (
              <Button
                disabled
                variant="outline"
                className="rounded-full px-6 py-5 bg-gray-100 text-gray-400"
              >
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                Conectando...
              </Button>
            ) : !isConnected ? (
              <Button
                onClick={startSession}
                className="rounded-full px-6 py-5 shadow-[0_4px_16px_rgba(187,231,149,0.35)] hover:shadow-[0_6px_20px_rgba(187,231,149,0.5)] bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Iniciar Entrevista (Live)
              </Button>
            ) : (
              <Button
                onClick={endSession}
                variant="destructive"
                className="rounded-full px-6 py-5 bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100 shadow-sm"
              >
                <Square className="w-4 h-4 fill-current mr-2" />
                Finalizar Llamada
              </Button>
            )}

            {phase === "intro" && (
              <Button
                onClick={advancePhase}
                variant="outline"
                className="rounded-full px-6 py-5 text-sm font-medium"
              >
                Llenar Formulario <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
        )}

        {/* ── Propuesta de portafolio (aparece al recibir recomendación del agente) ── */}
        {portfolioRec && (
          <ProposalCard rec={portfolioRec} onConfirm={() => setPhase("done")} />
        )}

        {/* ── KYC Form ── */}
        {phase !== "intro" && phase !== "upload" && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div>
              <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest mb-1">Datos personales</p>
              <h2 className="text-lg font-bold text-[#1a1a1a]">Validación de identidad</h2>
              <p className="text-sm text-gray-500 mt-0.5">Puedes rellenar el formulario mientras hablas con el asesor.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombres">
                <Input placeholder="Ej. María Camila" value={kyc.nombres} onChange={(e) => setKyc((k) => ({ ...k, nombres: e.target.value }))} disabled={phase !== "kyc"} />
              </Field>
              <Field label="Apellidos">
                <Input placeholder="Ej. Rodríguez Torres" value={kyc.apellidos} onChange={(e) => setKyc((k) => ({ ...k, apellidos: e.target.value }))} disabled={phase !== "kyc"} />
              </Field>

              <Field label="Tipo de documento">
                <select
                  value={kyc.tipoDoc}
                  onChange={(e) => setKyc((k) => ({ ...k, tipoDoc: e.target.value }))}
                  disabled={phase !== "kyc"}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PA">Pasaporte</option>
                  <option value="NIT">NIT</option>
                </select>
              </Field>
              <Field label="Número de documento">
                <Input placeholder="Ej. 1020304050" value={kyc.numDoc} onChange={(e) => setKyc((k) => ({ ...k, numDoc: e.target.value }))} disabled={phase !== "kyc"} />
              </Field>

              <Field label="Fecha de nacimiento">
                <Input type="date" value={kyc.fechaNac} onChange={(e) => setKyc((k) => ({ ...k, fechaNac: e.target.value }))} disabled={phase !== "kyc"} />
              </Field>
              <Field label="Correo electrónico">
                <Input type="email" placeholder="correo@ejemplo.com" value={kyc.email} onChange={(e) => setKyc((k) => ({ ...k, email: e.target.value }))} disabled={phase !== "kyc"} />
              </Field>

              <Field label="Número de celular">
                <Input placeholder="Ej. 3001234567" value={kyc.celular} onChange={(e) => setKyc((k) => ({ ...k, celular: e.target.value }))} disabled={phase !== "kyc"} />
              </Field>
            </div>

            {phase === "kyc" && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setPhase("risk")}
                  disabled={!kycValid}
                  className={`flex items-center gap-2 font-semibold transition-all duration-300 ${kycValid ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {(phase === "risk" || phase === "done") && (
              <div className="flex items-center gap-2 text-sm text-[#6abf1a] font-medium pt-2 border-t border-gray-100">
                <CheckCircle2 className="w-4 h-4" />
                <span>Datos obligatorios completos</span>
              </div>
            )}
          </div>
        )}

        {/* ── Risk Profile (cascada de preguntas) ── */}
        {(phase === "risk" || phase === "done") && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">

            {/* Pregunta 1: Perfil de riesgo */}
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest mb-1">Perfil de riesgo</p>
                <h2 className="text-lg font-bold text-[#1a1a1a]">¿Cuál describe mejor tu perfil?</h2>
                <p className="text-sm text-gray-500 mt-0.5">Selecciona el perfil que mejor se adapte a tus expectativas y tolerancia al riesgo. Cuéntale a la IA sobre esto para que te recomiende uno.</p>
              </div>
              <AnimatedOptions
                options={RISK_OPTIONS}
                selected={selectedRisk}
                onSelect={setSelectedRisk}
                disabled={phase === "done"}
              />
            </div>

            {/* Pregunta 2: Si el mercado sube — aparece al seleccionar perfil */}
            {selectedRisk && (
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest mb-1">Reacción al mercado</p>
                  <h2 className="text-lg font-bold text-[#1a1a1a]">Si el mercado sube, ¿qué harías?</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Tu reacción ante una subida nos ayuda a entender tus objetivos de rentabilidad.</p>
                </div>
                <AnimatedOptions
                  key="market-up"
                  options={MARKET_UP_OPTIONS}
                  selected={selectedMarketUp}
                  onSelect={setSelectedMarketUp}
                  disabled={phase === "done"}
                />
              </div>
            )}

            {/* Pregunta 3: Si el mercado baja — aparece al seleccionar reacción al alza */}
            {selectedMarketUp && (
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest mb-1">Reacción al mercado</p>
                  <h2 className="text-lg font-bold text-[#1a1a1a]">Si el mercado baja, ¿qué harías?</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Tu comportamiento ante las caídas define tu verdadera tolerancia al riesgo.</p>
                </div>
                <AnimatedOptions
                  key="market-down"
                  options={MARKET_DOWN_OPTIONS}
                  selected={selectedMarketDown}
                  onSelect={setSelectedMarketDown}
                  disabled={phase === "done"}
                />
              </div>
            )}

            {/* Pregunta 4: Horizonte de inversión — aparece al seleccionar reacción a la baja */}
            {selectedMarketDown && (
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest mb-1">Horizonte de inversión</p>
                  <h2 className="text-lg font-bold text-[#1a1a1a]">¿Cuál es tu preferencia de crecimiento?</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Define el horizonte temporal en el que planeas mantener tus inversiones.</p>
                </div>
                <AnimatedOptions
                  key="growth"
                  options={GROWTH_OPTIONS}
                  selected={selectedGrowth}
                  onSelect={setSelectedGrowth}
                  disabled={phase === "done"}
                />
              </div>
            )}

            {/* Botón confirmar — solo activo cuando todas las preguntas están respondidas */}
            {phase === "risk" && (
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  onClick={() => setPhase("done")}
                  disabled={!riskComplete}
                  className={`flex items-center gap-2 font-semibold transition-all duration-300 ${
                    riskComplete
                      ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Confirmar perfil
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {phase === "done" && (
              <div className="flex items-center gap-2 text-sm text-[#6abf1a] font-medium pt-2 border-t border-gray-100">
                <CheckCircle2 className="w-4 h-4" />
                <span>Perfil de riesgo configurado</span>
              </div>
            )}
          </div>
        )}

        {/* ── Done ── */}
        {phase === "done" && (
          <div className="bg-[#F0FEE6] rounded-2xl ring-1 ring-[#BBE795]/40 p-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#BBE795] shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#1a1a1a]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1a1a1a]">Verificación de identidad completada</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">Tus datos han sido registrados exitosamente. Continuaremos con el proceso de vinculación SARLAFT.</p>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Link href="/onboarding/sarlaft">
                <Button className="bg-[#1a1a1a] text-white hover:bg-black shadow-lg font-semibold flex items-center gap-2">
                  Continuar a SARLAFT
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
