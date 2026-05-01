"use client";

import { useState, useCallback, useEffect } from "react";
import { StartupStep } from "@/components/onboarding/StartupStep";
import { IntakeStep } from "@/components/onboarding/IntakeStep";
import { DocumentIngestStep } from "@/components/onboarding/DocumentIngestStep";
import { KycValidationStep } from "@/components/onboarding/KycValidationStep";
import { VoiceStep } from "@/components/onboarding/VoiceStep";
import { PortfolioStep } from "@/components/onboarding/PortfolioStep";
import { SarlaftStep } from "@/components/onboarding/SarlaftStep";
import type { PortfolioRecommendation } from "@/hooks/useVoiceAgent";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { MissingFieldRef, SarlaftPackage } from "@/lib/sarlaft/schema";
import { createEmptyPackage } from "@/lib/sarlaft/schema";
import { computeMissingFields } from "@/lib/sarlaft/missingFields";
import type { OcrReportItem } from "@/lib/sarlaft/ocrTypes";
import {
  applyIntakeToSarlaft,
  applyInterviewToSarlaft,
} from "@/lib/sarlaft/onboardingSarlaftMerge";

export type IntakeData = {
  nombre: string;
  empresa: string;
  sector: string;
};

const STEPS = [
  { id: 1, label: "Bienvenida", desc: "Preparación del proceso" },
  { id: 2, label: "Empresa", desc: "Representante legal y datos PJ" },
  { id: 3, label: "Ingesta", desc: "Documentación corporativa" },
  { id: 4, label: "KYC", desc: "Representante legal" },
  { id: 5, label: "Asesor", desc: "Perfil y objetivos" },
  { id: 6, label: "Portafolio", desc: "Recomendación de inversión" },
  { id: 7, label: "SARLAFT", desc: "Formularios y envío regulatorio" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [intake, setIntake] = useState<IntakeData>({ nombre: "", empresa: "", sector: "" });
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
  const [sarlaftPkg, setSarlaftPkg] = useState<SarlaftPackage | null>(null);
  const [sarlaftMissingFields, setSarlaftMissingFields] = useState<MissingFieldRef[]>([]);
  const [sarlaftOcrReport, setSarlaftOcrReport] = useState<OcrReportItem[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [preparingPortfolio, setPreparingPortfolio] = useState(false);
  const [prepProgress, setPrepProgress] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, 7));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleDocumentIngestContinue = useCallback(
    (payload: { package: SarlaftPackage; missing: MissingFieldRef[]; ocrReport: OcrReportItem[] | null }) => {
      const merged = applyIntakeToSarlaft(payload.package, intake);
      setSarlaftPkg(merged);
      setSarlaftMissingFields(computeMissingFields(merged));
      setSarlaftOcrReport(payload.ocrReport);
      next();
    },
    [intake]
  );

  const startPortfolioPreparation = useCallback(() => {
    setSarlaftPkg((prev) => {
      const base = prev ?? createEmptyPackage();
      const merged = recommendation ? applyInterviewToSarlaft(base, recommendation) : base;
      queueMicrotask(() => setSarlaftMissingFields(computeMissingFields(merged)));
      return merged;
    });
    setPreparingPortfolio(true);
    setPrepProgress(0);
  }, [recommendation]);

  useEffect(() => {
    if (!preparingPortfolio) return;

    const totalMs = 10000;
    const start = performance.now();
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const progress = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setPrepProgress(progress);
      if (progress >= 100) {
        window.clearInterval(tick);
        setPreparingPortfolio(false);
        setStep(6);
      }
    }, 100);

    return () => window.clearInterval(tick);
  }, [preparingPortfolio]);

  const handleGeneratePdf = useCallback(async () => {
    if (!sarlaftPkg) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/sarlaft/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: sarlaftPkg }),
      });
      if (!res.ok) throw new Error("Error generando PDFs");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sarlaft-formularios.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [sarlaftPkg]);

  const currentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-end mb-3">
            <Link
              href="/"
              className="text-xs font-semibold text-gray-500 hover:text-[#1a1a1a] transition-colors"
            >
              Volver al home
            </Link>
          </div>
          {/* Desktop / tablet: stepper centrado */}
          <nav
            aria-label="Progreso del onboarding"
            className="hidden min-[640px]:flex flex-wrap items-center justify-center gap-y-2"
          >
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-1.5 px-1 py-0.5 rounded-lg">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300 shrink-0 ${
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
                    className={`text-[11px] font-medium whitespace-nowrap transition-colors duration-300 ${
                      s.id === step ? "text-[#1a1a1a]" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block w-4 sm:w-6 h-px mx-0.5 transition-colors duration-500 shrink-0 ${
                      s.id < step ? "bg-[#BBE795]" : "bg-gray-200"
                    }`}
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </nav>

          {/* Móvil: contador + barra de progreso */}
          <div className="flex min-[640px]:hidden flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#4a7c59] uppercase tracking-wider">
                {currentStep.label}
              </span>
              <span className="text-xs text-gray-500 font-medium tabular-nums">
                Paso {step} / {STEPS.length}
              </span>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4a7c59] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {step === 1 && <StartupStep onNext={next} />}

        {step === 2 && (
          <IntakeStep
            data={intake}
            onChange={setIntake}
            onBack={back}
            onNext={(data) => {
              setIntake(data);
              next();
            }}
          />
        )}

        {step === 3 && (
          <DocumentIngestStep intake={intake} onContinue={handleDocumentIngestContinue} onBack={back} />
        )}

        {step === 4 && (
          <KycValidationStep
            intake={intake}
            onConfirmIdentity={(nombre) => {
              setIntake((i) => {
                const nextIntake = { ...i, nombre: nombre.trim() || i.nombre };
                setSarlaftPkg((p) => {
                  if (!p) return p;
                  const merged = applyIntakeToSarlaft(p, nextIntake);
                  queueMicrotask(() => setSarlaftMissingFields(computeMissingFields(merged)));
                  return merged;
                });
                return nextIntake;
              });
              next();
            }}
            onBack={back}
          />
        )}

        {step === 5 && (
          preparingPortfolio ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mx-auto mb-5 relative h-16 w-16 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-2 border-[#BBE795] border-t-[#4a7c59] animate-spin" />
                  <span className="h-3 w-3 rounded-full bg-[#4a7c59] animate-pulse" />
                </div>
                <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider text-center">
                  Preparando recomendación
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight text-center mt-2">
                  Estamos buscando el portafolio que más se ajusta a ti
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed text-center mt-2 max-w-lg mx-auto">
                  Estamos analizando tus respuestas para recomendar el repertorio de productos más adecuado para{" "}
                  <span className="font-medium text-[#1a1a1a]">{intake.empresa.trim() || "tu empresa"}</span>.
                </p>

                <div className="mt-6 max-w-md mx-auto">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progreso</span>
                    <span className="tabular-nums font-medium text-[#1a1a1a]">{prepProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#BBE795] to-[#4a7c59] transition-[width] duration-100 ease-linear"
                      style={{ width: `${prepProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    Esto toma aproximadamente 10 segundos.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <VoiceStep
              intake={intake}
              onRecommendation={(rec) => setRecommendation(rec)}
              onNext={startPortfolioPreparation}
              onBack={back}
            />
          )
        )}

        {step === 6 &&
          (sarlaftPkg ? (
            <PortfolioStep
              intake={intake}
              recommendation={recommendation}
              onNext={next}
              onBack={back}
              onRestart={() => {
                setStep(1);
                setIntake({ nombre: "", empresa: "", sector: "" });
                setRecommendation(null);
                setSarlaftPkg(null);
                setSarlaftMissingFields([]);
                setSarlaftOcrReport(null);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#6abf1a]" aria-hidden />
              <p className="text-sm">Preparando formularios…</p>
            </div>
          ))}

        {step === 7 &&
          (sarlaftPkg ? (
            <SarlaftStep
              sarlaftPkg={sarlaftPkg}
              missingFields={sarlaftMissingFields}
              ocrReport={sarlaftOcrReport}
              onSarlaftChange={setSarlaftPkg}
              onMissingResolved={(missing) => setSarlaftMissingFields(missing)}
              onGeneratePdf={handleGeneratePdf}
              generating={generating}
              onBack={back}
              onRestart={() => {
                setStep(1);
                setIntake({ nombre: "", empresa: "", sector: "" });
                setRecommendation(null);
                setSarlaftPkg(null);
                setSarlaftMissingFields([]);
                setSarlaftOcrReport(null);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#6abf1a]" aria-hidden />
              <p className="text-sm">Preparando formularios…</p>
            </div>
          ))}
      </main>

      <footer className="border-t border-gray-100 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <p className="text-xs text-gray-400">Proceso seguro · Cifrado extremo a extremo</p>
          <p className="text-xs text-gray-400">
            Paso <span className="font-semibold text-[#1a1a1a]">{step}</span> de {STEPS.length} ·{" "}
            <span className="text-[#1a1a1a] font-medium">{currentStep.desc}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
