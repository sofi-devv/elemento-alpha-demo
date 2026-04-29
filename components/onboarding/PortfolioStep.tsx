"use client";

import { useMemo, useState } from "react";
import {
  TrendingDown,
  BarChart2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Leaf,
  RefreshCw,
  RotateCcw,
  FileStack,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormsPreview } from "@/components/sarlaft/FormsPreview";
import type { PortfolioRecommendation } from "@/hooks/useVoiceAgent";
import type { IntakeData } from "@/app/onboarding/page";
import type { SarlaftPackage } from "@/lib/sarlaft/schema";

interface Props {
  intake: IntakeData;
  recommendation: PortfolioRecommendation | null;
  sarlaftPkg: SarlaftPackage;
  onSarlaftChange: (p: SarlaftPackage) => void;
  onGeneratePdf: () => Promise<void>;
  generating: boolean;
  onRestart: () => void;
  onBack?: () => void;
}

const PORTFOLIO_CONFIG = {
  conservador: {
    label: "FIC Conservador",
    tagline: "Seguridad y estabilidad ante todo",
    color: "#3b82f6",
    bg: "#eff6ff",
    ring: "ring-blue-200",
    icon: TrendingDown,
    metrics: [
      { label: "Rentabilidad esperada", value: "5–8% E.A." },
      { label: "Plazo mínimo", value: "3 meses" },
      { label: "Perfil de riesgo", value: "Bajo" },
      { label: "Liquidez", value: "Alta (T+1)" },
    ],
    instruments: ["FIC Líquido", "Fondo Ahorro Empresarial", "Fiducia de Garantía"],
    allocation: [
      { where: "Renta fija corto plazo (TES/CDT corporativo)", pct: "50%" },
      { where: "Fondos de liquidez y caja", pct: "30%" },
      { where: "Vehículos fiduciarios de bajo riesgo", pct: "20%" },
    ],
    description:
      "Ideal para empresas que priorizan la preservación del capital con retornos estables y acceso rápido a los recursos.",
  },
  moderado: {
    label: "FIC Equilibrio",
    tagline: "Balance entre crecimiento y seguridad",
    color: "#f59e0b",
    bg: "#fffbeb",
    ring: "ring-amber-200",
    icon: BarChart2,
    metrics: [
      { label: "Rentabilidad esperada", value: "8–13% E.A." },
      { label: "Plazo mínimo", value: "1 año" },
      { label: "Perfil de riesgo", value: "Medio" },
      { label: "Liquidez", value: "Media (T+3)" },
    ],
    instruments: ["FIC Simple General", "Fondo Cartera", "Fondo de Capital Privado"],
    allocation: [
      { where: "Renta fija corporativa y pública", pct: "40%" },
      { where: "Fondos balanceados / cartera multiactivo", pct: "35%" },
      { where: "Capital privado y alternativos", pct: "25%" },
    ],
    description:
      "Para empresas que buscan hacer crecer su patrimonio con una exposición controlada al riesgo.",
  },
  agresivo: {
    label: "FIC Crecimiento",
    tagline: "Máximo potencial de retorno",
    color: "#4a7c59",
    bg: "#F0FEE6",
    ring: "ring-[#BBE795]/60",
    icon: TrendingUp,
    metrics: [
      { label: "Rentabilidad esperada", value: "13–20%+ E.A." },
      { label: "Plazo mínimo", value: "3 años" },
      { label: "Perfil de riesgo", value: "Alto" },
      { label: "Liquidez", value: "Baja (T+5)" },
    ],
    instruments: ["Fondo Alternativo", "Fondo de Capital Privado", "Fiducia Inmobiliaria"],
    allocation: [
      { where: "Renta variable y activos de crecimiento", pct: "45%" },
      { where: "Fondos alternativos / private markets", pct: "35%" },
      { where: "Fiducias especializadas (inmobiliaria/estructurada)", pct: "20%" },
    ],
    description:
      "Diseñado para empresas con flujo estable que buscan maximizar el retorno con un horizonte de largo plazo.",
  },
};

function randomDefaultRecommendation(): PortfolioRecommendation {
  const options: PortfolioRecommendation[] = [
    {
      portfolio: "conservador",
      nombre: "FIC Conservador",
      perfil: "Conservador",
      plazo: "corto plazo",
      razon: "Perfil orientado a preservar capital y priorizar liquidez en el corto plazo.",
      productosRecomendados: ["FIC Líquido", "Fondo Ahorro Empresarial", "Fiducia de Garantía"],
    },
    {
      portfolio: "moderado",
      nombre: "FIC Equilibrio",
      perfil: "Moderado",
      plazo: "mediano plazo",
      razon: "Perfil balanceado con crecimiento controlado y exposición intermedia al riesgo.",
      productosRecomendados: ["FIC Simple General", "Fondo Cartera", "Fondo de Capital Privado"],
    },
    {
      portfolio: "agresivo",
      nombre: "FIC Crecimiento",
      perfil: "Agresivo",
      plazo: "largo plazo",
      razon: "Perfil de crecimiento con mayor tolerancia a variaciones y enfoque de largo plazo.",
      productosRecomendados: ["Fondo Alternativo", "Fondo de Capital Privado", "Fiducia Inmobiliaria"],
    },
  ];
  return options[Math.floor(Math.random() * options.length)];
}

const DOCUMENT_ITEMS = [
  "Paquete SARLAFT / FATCA / CRS / Vinculación (PDF editables y ZIP)",
  "Documentación cargada en ingesta (RUT, cámara de comercio, otros)",
  "Verificación KYC del representante legal",
];

export function PortfolioStep({
  intake,
  recommendation,
  sarlaftPkg,
  onSarlaftChange,
  onGeneratePdf,
  generating,
  onRestart,
  onBack,
}: Props) {
  const [accepted, setAccepted] = useState(false);
  const fallbackRec = useMemo(() => randomDefaultRecommendation(), []);
  const rec = recommendation ?? fallbackRec;
  const config = PORTFOLIO_CONFIG[rec.portfolio];
  const Icon = config.icon;
  const recommendedProducts =
    rec.productosRecomendados && rec.productosRecomendados.length > 0
      ? rec.productosRecomendados
      : config.instruments;
  const alternativeKeys = (Object.keys(PORTFOLIO_CONFIG) as Array<keyof typeof PORTFOLIO_CONFIG>).filter(
    (k) => k !== rec.portfolio
  );

  const handleRestart = () => {
    setAccepted(false);
    onRestart();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between">
        {onBack ? (
          <Button variant="ghost" onClick={onBack} className="h-9 px-0 text-gray-500">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
          </Button>
        ) : (
          <span />
        )}
        {!accepted ? (
          <Button
            id="portfolio-accept-top"
            type="button"
            onClick={() => setAccepted(true)}
            className="h-9 px-5 rounded-lg font-semibold gap-1.5 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            Aceptar portafolio <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            id="portfolio-restart-top"
            type="button"
            variant="ghost"
            onClick={handleRestart}
            className="h-9 px-3 text-gray-500 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
          </Button>
        )}
      </div>

      <header>
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-1">Paso 6 · Portafolio</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
          Recomendación para {intake.empresa.trim() || "tu empresa"}
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xl">
          Revisa el portafolio sugerido. Al aceptarlo podrás revisar y enviar la documentación regulatoria.
        </p>
      </header>

      <div
        className={`rounded-lg border p-6 shadow-sm ${config.ring}`}
        style={{ borderColor: `${config.color}40`, background: config.bg }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div
            className="w-14 h-14 rounded-md flex items-center justify-center shrink-0 bg-white shadow-sm"
            style={{ border: `1px solid ${config.color}30` }}
          >
            <Icon className="w-7 h-7" style={{ color: config.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: config.color }}
            >
              Tu portafolio recomendado
            </p>
            <h3 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mt-0.5">
              {config.label}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">{config.tagline}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.metrics.map((m) => (
            <div key={m.label} className="rounded-md bg-white/70 px-3 py-2.5 ring-1 ring-white/60">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide leading-tight">
                {m.label}
              </p>
              <p className="text-sm font-bold text-[#1a1a1a] mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: config.color }} />
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">
              ¿Por qué este portafolio?
            </p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{rec.razon}</p>
            {rec.monto && rec.monto !== "no especificado" && (
              <p className="text-xs text-gray-500 mt-1.5">
                Monto referenciado: <strong>{rec.monto}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
            Repertorio de productos recomendados
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recommendedProducts.map((inst) => (
              <span
                key={inst}
                className="px-2.5 py-1 rounded-md text-xs font-medium"
                style={{ background: config.bg, color: config.color }}
              >
                {inst}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{config.description}</p>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
            ¿Dónde están las inversiones?
          </p>
          <ul className="space-y-2">
            {config.allocation.map((slice) => (
              <li key={slice.where} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-gray-600 leading-relaxed">{slice.where}</span>
                <span className="font-semibold text-[#1a1a1a] tabular-nums shrink-0">{slice.pct}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-400 mt-2">
            Distribución de referencia, sujeta a ajustes por comité y condiciones de mercado.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
          {rec.plazo === "corto plazo" ? (
            <Clock className="w-5 h-5 text-blue-500 shrink-0" />
          ) : rec.plazo === "largo plazo" ? (
            <Leaf className="w-5 h-5 text-[#4a7c59] shrink-0" />
          ) : (
            <RefreshCw className="w-5 h-5 text-amber-500 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">Horizonte de inversión</p>
            <p className="text-xs text-gray-500 capitalize">{rec.plazo}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Otros portafolios disponibles
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {alternativeKeys.map((key) => {
            const alt = PORTFOLIO_CONFIG[key];
            const AltIcon = alt.icon;
            return (
              <div key={key} className="rounded-lg border border-gray-100 bg-white p-3.5">
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: alt.bg }}
                  >
                    <AltIcon className="w-4 h-4" style={{ color: alt.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a1a] leading-snug">{alt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{alt.tagline}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Riesgo: <span className="font-medium text-[#1a1a1a]">{alt.metrics[2].value}</span></span>
                  <span>Plazo: <span className="font-medium text-[#1a1a1a]">{alt.metrics[1].value}</span></span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {alt.instruments.slice(0, 2).map((inst) => (
                    <span
                      key={inst}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{ background: alt.bg, color: alt.color }}
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!accepted ? (
        <div className="space-y-2 pt-2">
          <Button
            id="portfolio-accept"
            type="button"
            className="w-full h-11 rounded-lg font-semibold text-sm gap-1.5 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] shadow-sm hover:shadow-md transition-all duration-200"
            onClick={() => setAccepted(true)}
          >
            Aceptar portafolio recomendado <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            id="portfolio-restart"
            variant="ghost"
            type="button"
            onClick={handleRestart}
            className="w-full h-9 rounded-lg text-sm text-gray-500 hover:text-gray-700 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reiniciar proceso
          </Button>
        </div>
      ) : (
        <div className="space-y-5 pt-2 animate-in fade-in duration-300">
          <div className="rounded-lg border border-[#BBE795] bg-[#F0FEE6]/50 px-4 py-3 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4a7c59] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">Portafolio aceptado</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Aquí tienes el paquete regulatorio generado y lo que puedes enviar para cerrar la vinculación.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileStack className="w-5 h-5 text-[#4a7c59]" />
              <p className="text-sm font-bold text-[#1a1a1a]">Documentación que puedes enviar</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              {DOCUMENT_ITEMS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#4a7c59] shrink-0 mt-0.5">·</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Formularios SARLAFT (editables)
            </p>
            <FormsPreview
              value={sarlaftPkg}
              onChange={onSarlaftChange}
              onGeneratePdf={onGeneratePdf}
              generating={generating}
              ocrReport={null}
            />
          </div>

          <div className="space-y-2 pt-1">
            <Button
              id="portfolio-contact"
              type="button"
              className="w-full h-11 rounded-lg font-semibold text-sm bg-[#4a7c59] text-white hover:bg-[#3f6b4c] shadow-sm hover:shadow-md transition-all duration-200"
            >
              Hablar con un asesor de Elemento Alpha
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleRestart}
              className="w-full h-9 rounded-lg text-sm text-gray-500 hover:text-gray-700 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reiniciar proceso
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
