"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntakeStep } from "@/components/onboarding/IntakeStep";
import { VoiceStep } from "@/components/onboarding/VoiceStep";
import { DocsStep } from "@/components/onboarding/DocsStep";
import { PortfolioStep } from "@/components/onboarding/PortfolioStep";
import type { PortfolioRecommendation } from "@/hooks/useVoiceAgent";

export type IntakeData = {
  nombre: string;
  empresa: string;
  sector: string;
};

const STEPS = [
  { id: 1, label: "Datos básicos" },
  { id: 2, label: "Entrevista" },
  { id: 3, label: "Documentos" },
  { id: 4, label: "Portafolio" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [intake, setIntake] = useState<IntakeData>({ nombre: "", empresa: "", sector: "" });
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
  const router = useRouter();

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Elemento Alpha
            </p>
            <h1 className="text-base font-semibold text-[#1a1a1a] leading-tight">
              Vinculación de Cliente
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-all duration-300 ${
                    s.id < step
                      ? "bg-[#BBE795] text-[#1a1a1a]"
                      : s.id === step
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s.id < step ? "✓" : s.id}
                </div>
                {s.id < STEPS.length && (
                  <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${s.id < step ? "bg-[#BBE795]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Step label */}
        <div className="max-w-2xl mx-auto px-6 pb-3">
          <p className="text-xs text-gray-500">
            Paso {step} de {STEPS.length} — <span className="font-semibold text-[#1a1a1a]">{STEPS[step - 1].label}</span>
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {step === 1 && (
          <IntakeStep
            data={intake}
            onChange={setIntake}
            onNext={(data) => { setIntake(data); next(); }}
          />
        )}
        {step === 2 && (
          <VoiceStep
            intake={intake}
            onRecommendation={(rec) => setRecommendation(rec)}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <DocsStep
            intake={intake}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <PortfolioStep
            intake={intake}
            recommendation={recommendation}
            onRestart={() => { setStep(1); setIntake({ nombre: "", empresa: "", sector: "" }); setRecommendation(null); }}
          />
        )}
      </main>
    </div>
  );
}
