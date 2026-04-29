"use client";

import { useState, useCallback } from "react";
import { IntakeStep } from "@/components/onboarding/IntakeStep";
import { DocsStep } from "@/components/onboarding/DocsStep";
import { VoiceStep } from "@/components/onboarding/VoiceStep";
import { PortfolioStep } from "@/components/onboarding/PortfolioStep";
import { FormsPreview } from "@/components/sarlaft/FormsPreview";
import type { PortfolioRecommendation } from "@/hooks/useVoiceAgent";
import type { SarlaftPackage } from "@/lib/sarlaft/schema";
import { SAGRILAFT_OTRAS_14_LABELS } from "@/lib/sarlaft/schema";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type IntakeData = {
  nombre: string;
  empresa: string;
  sector: string;
};

const STEPS = [
  { id: 1, label: "Ingesta de datos",   desc: "Tu información" },
  { id: 2, label: "Validación KYC",     desc: "Documentos" },
  { id: 3, label: "Asesor de voz",      desc: "Perfil de riesgo" },
  { id: 4, label: "Formularios",        desc: "Resultado SARLAFT" },
  { id: 5, label: "Recomendación",      desc: "Fondo de inversión" },
];

function buildDemoPackage(intake: IntakeData): SarlaftPackage {
  const empresa = intake.empresa || "Acropolis Labs S.A.S.";
  const nombre  = intake.nombre  || "Paula Torres";
  return {
    formulario_1: {
      id_formulario: "1",
      nombre_completo_razon_social: empresa,
      tipo_y_numero_identificacion: "NIT 901.234.567-8",
      num_oficinas_pais: 1,
      num_oficinas_exterior: 0,
      ciudades_paises_operacion: "Bogotá, Colombia",
      politicas: {
        programa_laft_documentado: { pregunta: "¿Su entidad tiene un programa/sistema LA/FT documentado y actualizado?", respuesta: "Sí", detalle_programa: { organo_aprobacion: "Junta Directiva", fecha_aprobacion: "2024-03-15" } },
        regulacion_gubernamental_laft: { pregunta: "¿Su entidad está sujeta a regulación gubernamental LA/FT?", respuesta: "Sí", detalle_regulacion: { normatividad: "Ley 526 de 1999 / Decreto 1674 de 2021" } },
        oficial_cumplimiento: { pregunta: "¿Tiene Oficial de Cumplimiento designado?", respuesta: "Sí", detalle_oficial: { nombre: "Carolina Gómez Ríos", identificacion: "52.845.123", cargo: "Oficial de Cumplimiento", email: "c.gomez@empresa.co", telefono: "3001234567" } },
        operaciones_efectivo: { pregunta: "¿Realiza operaciones en efectivo?", respuesta: "No" },
        activos_virtuales: { pregunta: "¿Realiza transacciones o posee activos virtuales?", respuesta: "No" },
        sancionada_investigada: { pregunta: "¿La entidad ha sido sancionada o investigada por procesos de lavado de activos?", respuesta: "No" },
        otras_14_preguntas: SAGRILAFT_OTRAS_14_LABELS.map((etiqueta) => ({ etiqueta, respuesta: "No" as const })),
      },
    },
    formulario_2: {
      id_formulario: "2",
      razon_social: empresa,
      identificacion_tributaria: "901.234.567-8",
      pais_constitucion_fiscal: "Colombia",
      actividad_principal: "d) Negocios de instrumentos de inversión (Fondos)",
      ingresos_activos_pasivos_50: "No",
      clasificacion_fatca_crs: "Entidad participante",
      ubo: { datos_personales: `${nombre} — Representante Legal`, paises_tin: [{ pais: "Colombia", tin: "1.020.456.789" }], tipo_control: "Control por propiedad" },
    },
    formulario_3: {
      id_formulario: "3",
      tipo_empresa: "S.A.S.",
      cifras_financieras: { ingresos: 850000000, egresos: 620000000, total_activos: 1200000000, total_pasivos: 350000000, total_patrimonio: 850000000 },
      administra_recursos_publicos: "No",
      grupo_contable_niif: "Grupo 2 (Pymes)",
      ciclo_empresa: "Joven/Crecimiento",
      liquidez: "Algo relevante",
      experiencia_inversion: "Fondos de Inversión",
      tolerancia_riesgo: "Esperar/Invertir más aprovechando precios bajos",
      representantes_ordenates: `${nombre} — CC 1.020.456.789`,
      es_pep: "No",
      accionistas: [{ nombre, id: "1.020.456.789", porcentaje: 60, cotiza_en_bolsa: "No" }, { nombre: "Santiago Rueda", id: "1.019.234.567", porcentaje: 40, cotiza_en_bolsa: "No" }],
      calidad_beneficiario_final: ["Por Titularidad (Capital / Derechos de voto)", "Por Control (Representante legal / Mayor autoridad)"],
    },
  };
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [intake, setIntake] = useState<IntakeData>({ nombre: "", empresa: "", sector: "" });
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
  const [sarlaftPkg, setSarlaftPkg] = useState<SarlaftPackage | null>(null);
  const [generating, setGenerating] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between">
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
                    className={`w-4 h-px mx-1 transition-colors duration-500 ${
                      s.id < step ? "bg-[#BBE795]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </nav>

          <span className="sm:hidden text-xs text-gray-400 font-medium">
            {step} / {STEPS.length}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-8 py-10">
        {step === 1 && (
          <IntakeStep
            data={intake}
            onChange={setIntake}
            onNext={(data) => { setIntake(data); next(); }}
          />
        )}

        {step === 2 && (
          <DocsStep
            intake={intake}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 3 && (
          <VoiceStep
            intake={intake}
            onRecommendation={(rec) => setRecommendation(rec)}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 4 && (() => {
          const pkg = sarlaftPkg ?? buildDemoPackage(intake);
          if (!sarlaftPkg) setSarlaftPkg(pkg);
          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-1">Paso 4 · Resultado SARLAFT</p>
                <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Validación de formularios</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Revisa los formularios generados a partir de los documentos KYC. Puedes editar cualquier campo antes de continuar.
                </p>
              </div>
              <FormsPreview
                value={pkg}
                onChange={setSarlaftPkg}
                onGeneratePdf={handleGeneratePdf}
                generating={generating}
                ocrReport={null}
              />
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={back} className="text-gray-400 hover:text-gray-700 flex items-center gap-1.5 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </Button>
                <Button
                  onClick={next}
                  className="rounded-xl px-6 h-10 font-semibold text-sm flex items-center gap-2 bg-[#1a1a1a] text-white hover:bg-black shadow-md"
                >
                  Ver recomendación <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })()}

        {step === 5 && (
          <PortfolioStep
            intake={intake}
            recommendation={recommendation}
            onRestart={() => {
              setStep(1);
              setIntake({ nombre: "", empresa: "", sector: "" });
              setRecommendation(null);
              setSarlaftPkg(null);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-4">
        <div className="max-w-3xl mx-auto px-8 flex items-center justify-between">
          <p className="text-xs text-gray-400">Proceso seguro · Cifrado extremo a extremo</p>
          <p className="text-xs text-gray-400">
            Paso <span className="font-semibold text-[#1a1a1a]">{step}</span> de {STEPS.length} —{" "}
            <span className="text-[#1a1a1a] font-medium">{currentStep.desc}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
