"use client";

import { useState } from "react";
import { MessageSquare, Square, ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceAgent, type PortfolioRecommendation } from "@/hooks/useVoiceAgent";
import type { IntakeData } from "@/app/onboarding/page";

interface Props {
  intake: IntakeData;
  onRecommendation: (rec: PortfolioRecommendation) => void;
  onNext: () => void;
  onBack: () => void;
}

function VoicePulse({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
      {speaking && (
        <>
          <span
            className="absolute inline-flex h-24 w-24 rounded-full bg-[#BBE795]/20 animate-ping"
            style={{ animationDuration: "1.8s" }}
          />
          <span
            className="absolute inline-flex h-16 w-16 rounded-full bg-[#BBE795]/30 animate-ping"
            style={{ animationDuration: "1.8s", animationDelay: "0.4s" }}
          />
        </>
      )}
      <span
        className={`absolute inline-flex h-16 w-16 rounded-full border-2 transition-all duration-500 ${
          speaking ? "border-[#4a7c59] scale-110" : "border-[#BBE795]/40"
        }`}
      />
      <span
        className={`absolute inline-flex h-10 w-10 rounded-full transition-all duration-500 ${
          speaking ? "bg-[#BBE795]/40 scale-110" : "bg-[#BBE795]/15"
        }`}
      />
      <span
        className={`relative inline-flex h-5 w-5 rounded-full bg-[#4a7c59] transition-all duration-300 ${
          speaking ? "scale-125 shadow-[0_0_18px_rgba(74,124,89,0.55)]" : ""
        }`}
      />
    </div>
  );
}

const QUESTIONS = [
  "Ciclo actual de la empresa",
  "Necesidad de liquidez inmediata",
  "Horizonte esperado de liquidez",
  "Experiencia de inversión",
  "Expectativa de variación",
  "Decisión ante desvalorización",
];

export function VoiceStep({ intake, onRecommendation, onNext, onBack }: Props) {
  const [receivedRec, setReceivedRec] = useState<PortfolioRecommendation | null>(null);

  const handleRecommendation = (rec: PortfolioRecommendation) => {
    setReceivedRec(rec);
    onRecommendation(rec);
  };

  const { startSession, endSession, isConnected, isConnecting, isSpeaking, error } = useVoiceAgent({
    voiceName: "Zephyr",
    intakeData: intake,
    onRecommendation: handleRecommendation,
  });

  const handleEnd = () => {
    endSession();
  };

  const canAdvance = Boolean(receivedRec) || !isConnected;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="h-9 px-0 text-gray-500">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
        </Button>
        <Button
          id="voice-next-top"
          onClick={onNext}
          disabled={!canAdvance}
          className={`h-9 px-5 rounded-lg font-semibold gap-1.5 transition-all duration-200 ${
            canAdvance
              ? "bg-[#4a7c59] text-white hover:bg-[#3f6b4c] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {receivedRec ? "Continuar" : "Avanzar"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-1">Paso 5 · Asesor</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
          Hola{intake.nombre.trim() ? `, ${intake.nombre.trim().split(/\s+/)[0]}` : ""}
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xl">
          El asesor de IA hará <span className="font-medium text-[#1a1a1a]">6 preguntas</span> sobre la
          empresa para proponer un portafolio a{" "}
          <span className="font-medium text-[#1a1a1a]">
            {intake.empresa.trim() || "tu empresa"}
          </span>
          . Son preguntas cerradas y puedes responder por número de opción. Puedes terminar la llamada cuando quieras.
        </p>
      </header>

      <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm text-center space-y-6">
        <VoicePulse speaking={isSpeaking} />

        <div className="flex justify-center">
          {error ? (
            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold ring-1 ring-red-200">
              Error de conexión
            </span>
          ) : isConnecting ? (
            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold ring-1 ring-amber-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Conectando…
            </span>
          ) : isConnected ? (
            <span className="px-3 py-1 bg-[#F0FEE6] text-[#4a7c59] rounded-full text-xs font-semibold ring-1 ring-[#BBE795]/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse" />
              {isSpeaking ? "Hablando · LIVE" : "Escuchando · LIVE"}
            </span>
          ) : receivedRec ? (
            <span className="px-3 py-1 bg-[#F0FEE6] text-[#4a7c59] rounded-full text-xs font-semibold ring-1 ring-[#BBE795]/40 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Entrevista completada
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-semibold ring-1 ring-gray-200">
              Listo para iniciar
            </span>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-xl mx-auto">
          {QUESTIONS.map((q, i) => (
            <li
              key={q}
              className="flex items-center gap-2 text-xs text-gray-500"
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-100 text-gray-500 shrink-0">
                {i + 1}
              </span>
              <span className="leading-tight">{q}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-center gap-3 pt-2">
          {isConnecting ? (
            <Button disabled variant="outline" className="rounded-lg px-6 h-10">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
              Conectando…
            </Button>
          ) : !isConnected ? (
            <Button
              id="voice-start"
              onClick={startSession}
              className="rounded-lg px-6 h-10 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] font-semibold gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" /> Iniciar entrevista de voz
            </Button>
          ) : (
            <Button
              id="voice-end"
              onClick={handleEnd}
              variant="outline"
              className="rounded-lg px-5 h-10 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-semibold gap-2"
            >
              <Square className="w-3 h-3 fill-current" /> Finalizar llamada
            </Button>
          )}
        </div>
      </div>

      {receivedRec && (
        <div className="bg-[#F0FEE6] rounded-lg border border-[#BBE795] p-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="w-5 h-5 text-[#4a7c59]" />
            <p className="text-sm font-bold text-[#1a1a1a]">
              Perfil identificado: {receivedRec.perfil}
            </p>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{receivedRec.razon}</p>
          <p className="text-xs text-gray-500 mt-1.5">
            Portafolio sugerido: <strong>{receivedRec.nombre}</strong> · {receivedRec.plazo}
          </p>
        </div>
      )}
    </div>
  );
}
