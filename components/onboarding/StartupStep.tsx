"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, ClipboardList, FileText, IdCard, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  onNext: () => void;
}

const DOC_CATEGORIES = [
  {
    title: "Representante legal",
    icon: IdCard,
    points: [
      "Cédula o pasaporte del representante legal.",
      "Documento legible por ambas caras (si aplica).",
    ],
  },
  {
    title: "Documentación corporativa",
    icon: Building2,
    points: ["RUT actualizado.", "Certificado de cámara de comercio vigente."],
  },
  {
    title: "Soportes adicionales",
    icon: FileText,
    points: ["Estados financieros o soportes complementarios (si aplican)."],
  },
];

const FLOW_POINTS = [
  "Datos de la empresa y del representante legal.",
  "Ingesta de documentación corporativa.",
  "Validación KYC del representante legal.",
  "Asesor por voz y recomendación de portafolio.",
];

export function StartupStep({ onNext }: Props) {
  const [introStep, setIntroStep] = useState<1 | 2>(1);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const isLast = introStep === 2;
  const canGoBackInside = introStep > 1;

  const handleBack = () => {
    if (canGoBackInside) setIntroStep(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          disabled={!canGoBackInside}
          onClick={handleBack}
          className="h-9 px-0 text-gray-500 disabled:text-gray-300 disabled:opacity-60"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
        </Button>
        <Button
          onClick={() => (isLast ? onNext() : setIntroStep(2))}
          className="h-9 px-5 rounded-lg font-semibold gap-1.5 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLast ? "Comenzar" : "Continuar"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-1">Paso 1 · Bienvenida</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Vinculación de persona jurídica</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xl">
          Te acompañamos paso a paso. La carga inicial de información es la parte más demandante; cuando la
          completemos, el resto del proceso será rápido y la recomendación de inversión será más precisa.
        </p>
      </header>

      <Card className="rounded-lg border border-gray-100 shadow-sm gap-0 py-0">
        <CardHeader className="px-6 py-5 border-b border-gray-100 space-y-4">
          <div className="flex items-center gap-2" aria-label="Sub-pasos de bienvenida">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                    introStep >= n ? "bg-[#4a7c59] text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {n}
                </div>
                {n < 2 && <div className={`h-px w-8 ${introStep > n ? "bg-[#4a7c59]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-[#F0FEE6] flex items-center justify-center shrink-0">
              {introStep === 1 ? (
                <Sparkles className="h-5 w-5 text-[#4a7c59]" />
              ) : (
                <ClipboardList className="h-5 w-5 text-[#4a7c59]" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {introStep === 1 ? "Lo que haremos a continuación" : "Lo que debes tener a la mano"}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {introStep === 1
                  ? "Te guiamos paso a paso para completar la vinculación."
                  : "Para que el proceso sea rápido y sin fricción."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {introStep === 1 ? (
            <ol className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {FLOW_POINTS.map((point, i) => (
                <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-[#F0FEE6] text-[#4a7c59] text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-2">
              {DOC_CATEGORIES.map((category, idx) => {
                const Icon = category.icon;
                const isOpen = activeCategory === idx;
                return (
                  <details
                    key={category.title}
                    className="group rounded-lg border border-gray-100 bg-white open:bg-[#fcfef8] open:border-[#dcecd0]"
                    open={isOpen}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveCategory(isOpen ? -1 : idx);
                    }}
                  >
                    <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a]">
                        <Icon className="h-4 w-4 text-[#4a7c59] shrink-0" />
                        {category.title}
                      </span>
                      <span className={`text-xs text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
                    </summary>
                    <div className="px-3 pb-3">
                      <ul className="space-y-2">
                        {category.points.map((point) => (
                          <li key={point} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#4a7c59] shrink-0" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
