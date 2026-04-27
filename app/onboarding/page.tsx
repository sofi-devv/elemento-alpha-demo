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
  { id: 1, label: "Datos básicos", desc: "Tu información" },
  { id: 2, label: "Entrevista", desc: "Perfil de riesgo" },
  { id: 3, label: "Documentos", desc: "KYC & SARLAFT" },
  { id: 4, label: "Portafolio", desc: "Tu recomendación" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [intake, setIntake] = useState<IntakeData>({ nombre: "", empresa: "", sector: "" });
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
  const router = useRouter();

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between">
          {/* Spacer left */}
          <div />

          {/* Step tracker */}
          <nav className="hidden sm:flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
                  <div
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-all duration-300 ${
                      s.id < step
                        ? "bg-[#BBE795] text-[#1a1a1a]"
                        : s.id === step
                        ? "bg-[#4a7c59] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {s.id < step ? "✓" : s.id}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${
                      s.id === step ? "text-[#1a1a1a]" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-6 h-px mx-1 transition-colors duration-500 ${
                      s.id < step ? "bg-[#BBE795]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </nav>

          {/* Mobile step counter */}
          <span className="sm:hidden text-xs text-gray-400 font-medium">
            {step} / {STEPS.length}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-8 py-10">
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
            onRestart={() => {
              setStep(1);
              setIntake({ nombre: "", empresa: "", sector: "" });
              setRecommendation(null);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-4">
        <div className="max-w-3xl mx-auto px-8 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Proceso seguro · Cifrado extremo a extremo
          </p>
          <p className="text-xs text-gray-400">
            Paso <span className="font-semibold text-[#1a1a1a]">{step}</span> de {STEPS.length} —{" "}
            <span className="text-[#1a1a1a] font-medium">{STEPS[step - 1].desc}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
