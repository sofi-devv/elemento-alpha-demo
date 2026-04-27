"use client";

import { TrendingDown, BarChart2, TrendingUp, CheckCircle2, Clock, Leaf, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortfolioRecommendation } from "@/hooks/useVoiceAgent";
import type { IntakeData } from "@/app/onboarding/page";

interface Props {
  intake: IntakeData;
  recommendation: PortfolioRecommendation | null;
  onRestart: () => void;
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
    instruments: ["CDTs AAA", "TES corto plazo", "Fondos de liquidez"],
    description: "Ideal para empresas que priorizan la preservación del capital con retornos estables y acceso rápido a los recursos.",
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
    instruments: ["Renta fija corporativa", "TES largo plazo", "Renta variable diversificada"],
    description: "Para empresas que buscan hacer crecer su patrimonio con una exposición controlada al riesgo.",
  },
  agresivo: {
    label: "FIC Crecimiento",
    tagline: "Máximo potencial de retorno",
    color: "#6abf1a",
    bg: "#F0FEE6",
    ring: "ring-[#BBE795]/40",
    icon: TrendingUp,
    metrics: [
      { label: "Rentabilidad esperada", value: "13–20%+ E.A." },
      { label: "Plazo mínimo", value: "3 años" },
      { label: "Perfil de riesgo", value: "Alto" },
      { label: "Liquidez", value: "Baja (T+5)" },
    ],
    instruments: ["Renta variable nacional", "Fondos internacionales", "Alternativos"],
    description: "Diseñado para empresas con flujo estable que buscan maximizar el retorno con un horizonte de largo plazo.",
  },
};

const DEFAULT_REC: PortfolioRecommendation = {
  portfolio: "moderado",
  nombre: "FIC Equilibrio",
  perfil: "Moderado",
  plazo: "mediano plazo",
  razon: "Perfil de riesgo balanceado basado en las características de su empresa.",
};

export function PortfolioStep({ intake, recommendation, onRestart }: Props) {
  const rec = recommendation ?? DEFAULT_REC;
  const config = PORTFOLIO_CONFIG[rec.portfolio];
  const Icon = config.icon;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="text-center py-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          style={{ background: config.bg, border: `2px solid ${config.color}30` }}
        >
          <Icon className="w-8 h-8" style={{ color: config.color }} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: config.color }}>
          Tu portafolio recomendado
        </p>
        <h2 className="text-3xl font-bold text-[#1a1a1a] tracking-tight">{config.label}</h2>
        <p className="text-sm text-gray-500 mt-1">{config.tagline}</p>
      </div>

      {/* Reason banner */}
      <div className={`rounded-2xl ring-1 p-4 ${config.ring}`} style={{ background: config.bg }}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: config.color }} />
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">¿Por qué este portafolio para {intake.empresa}?</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{rec.razon}</p>
            {rec.monto && rec.monto !== "no especificado" && (
              <p className="text-xs text-gray-500 mt-2">Monto referenciado: <strong>{rec.monto}</strong></p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Características del portafolio</p>
        <div className="grid grid-cols-2 gap-4">
          {config.metrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <p className="text-[11px] text-gray-400 font-medium">{m.label}</p>
              <p className="text-sm font-bold text-[#1a1a1a]">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Instruments */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Instrumentos principales</p>
        <div className="flex flex-wrap gap-2">
          {config.instruments.map((inst) => (
            <span
              key={inst}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: config.bg, color: config.color }}
            >
              {inst}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{config.description}</p>
      </div>

      {/* Timeline indicator */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm">
        {rec.plazo === "corto plazo" ? <Clock className="w-5 h-5 text-blue-500" /> :
         rec.plazo === "largo plazo" ? <Leaf className="w-5 h-5 text-[#6abf1a]" /> :
         <RefreshCw className="w-5 h-5 text-amber-500" />}
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">Horizonte de inversión</p>
          <p className="text-xs text-gray-500 capitalize">{rec.plazo}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-2">
        <Button
          id="portfolio-contact"
          className="w-full h-12 rounded-xl font-semibold text-sm"
          style={{ background: config.color, color: config.color === "#6abf1a" ? "#1a1a1a" : "white" }}
        >
          Hablar con un asesor de Elemento Alpha
        </Button>
        <Button
          id="portfolio-restart"
          variant="ghost"
          onClick={onRestart}
          className="w-full h-10 rounded-xl text-sm text-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar proceso
        </Button>
      </div>
    </div>
  );
}
