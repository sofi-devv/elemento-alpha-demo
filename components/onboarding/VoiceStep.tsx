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
          <span className="absolute inline-flex h-24 w-24 rounded-full bg-[#BBE795]/20 animate-ping" style={{ animationDuration: "1.8s" }} />
          <span className="absolute inline-flex h-16 w-16 rounded-full bg-[#BBE795]/30 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.4s" }} />
        </>
      )}
      <span className={`absolute inline-flex h-16 w-16 rounded-full border-2 transition-all duration-500 ${speaking ? "border-[#BBE795] scale-110" : "border-[#BBE795]/30"}`} />
      <span className={`absolute inline-flex h-10 w-10 rounded-full transition-all duration-500 ${speaking ? "bg-[#BBE795]/40 scale-110" : "bg-[#BBE795]/15"}`} />
      <span className={`relative inline-flex h-5 w-5 rounded-full bg-[#6abf1a] transition-all duration-300 ${speaking ? "scale-125 shadow-[0_0_20px_rgba(106,191,26,0.7)]" : "shadow-[0_0_8px_rgba(106,191,26,0.3)]"}`} />
    </div>
  );
}

const QUESTIONS = [
  "Objetivo de inversión",
  "Monto y horizonte",
  "Tolerancia al riesgo",
  "Experiencia y liquidez",
  "Situación financiera",
];

export function VoiceStep({ intake, onRecommendation, onNext, onBack }: Props) {
  const [receivedRec, setReceivedRec] = useState<PortfolioRecommendation | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);

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
    if (questionIdx >= 3) setQuestionIdx(5); // show all done
  };

  const canAdvance = receivedRec || !isConnected;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-gray-700 flex items-center gap-1.5 text-sm px-0">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
        <Button
          id="voice-next-top"
          onClick={onNext}
          disabled={!canAdvance}
          className={`rounded-lg px-5 h-9 font-semibold text-sm flex items-center gap-2 transition-all duration-200 ${
            canAdvance ? "bg-[#4a7c59] text-white hover:bg-[#3f6b4c] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0" : "bg-gray-100 text-gray-400"
          }`}
        >
          {receivedRec ? "Siguiente" : "Avanzar"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Intro card */}
      <div className="text-center py-4">
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-2">Paso 5 · Asesor</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
          Hola{(intake.nombre.trim() ? `, ${intake.nombre.trim().split(/\s+/)[0]}` : "")} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          El asesor de IA hará <strong>5 preguntas</strong> sobre la empresa para proponer un portafolio a{" "}
          <strong>{intake.empresa.trim() || "tu empresa"}</strong>. Puedes terminar cuando quieras.
        </p>
      </div>

      {/* Voice card */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-8 shadow-sm text-center space-y-6">
        <VoicePulse speaking={isSpeaking} />

        {/* Status badge */}
        <div className="flex justify-center">
          {error ? (
            <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-semibold ring-1 ring-red-200">
              Error de conexión
            </span>
          ) : isConnecting ? (
            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold ring-1 ring-amber-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Conectando...
            </span>
          ) : isConnected ? (
            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold ring-1 ring-green-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {isSpeaking ? "Hablando · LIVE" : "Escuchando · LIVE"}
            </span>
          ) : receivedRec ? (
            <span className="px-3 py-1 bg-[#F0FEE6] text-[#6abf1a] rounded-full text-xs font-semibold ring-1 ring-[#BBE795]/40 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Entrevista completada
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-xs font-semibold ring-1 ring-gray-200">
              Listo para iniciar
            </span>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Questions tracker */}
        {isConnected && (
          <div className="grid grid-cols-5 gap-2 text-center animate-in fade-in duration-300">
            {QUESTIONS.map((q, i) => (
              <div key={q} className="space-y-1">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  i < questionIdx ? "bg-[#BBE795] text-[#1a1a1a]" : i === questionIdx ? "bg-[#1a1a1a] text-white animate-pulse" : "bg-gray-100 text-gray-400"
                }`}>{i < questionIdx ? "✓" : i + 1}</div>
                <p className="text-[9px] text-gray-400 leading-tight">{q}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex justify-center gap-3">
          {isConnecting ? (
            <Button disabled variant="outline" className="rounded-full px-6">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
              Conectando...
            </Button>
          ) : !isConnected ? (
            <Button
              id="voice-start"
              onClick={startSession}
              className="rounded-full px-8 h-11 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] font-semibold shadow-[0_4px_16px_rgba(74,124,89,0.35)] flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Iniciar entrevista de voz
            </Button>
          ) : (
            <Button
              id="voice-end"
              onClick={handleEnd}
              variant="outline"
              className="rounded-full px-6 h-11 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-semibold flex items-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Finalizar llamada
            </Button>
          )}
        </div>
      </div>

      {/* Recommendation preview */}
      {receivedRec && (
        <div className="bg-[#F0FEE6] rounded-2xl ring-1 ring-[#BBE795]/40 p-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-[#6abf1a]" />
            <p className="text-sm font-bold text-[#1a1a1a]">Perfil identificado: {receivedRec.perfil}</p>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{receivedRec.razon}</p>
          <p className="text-xs text-gray-500 mt-1">Portafolio sugerido: <strong>{receivedRec.nombre}</strong> · {receivedRec.plazo}</p>
        </div>
      )}

      <div className="pt-1" />
    </div>
  );
}
