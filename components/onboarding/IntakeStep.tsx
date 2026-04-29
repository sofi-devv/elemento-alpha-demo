"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ArrowRight, Check } from "lucide-react";
import type { IntakeData } from "@/app/onboarding/page";

const SECTORS = [
  "Tecnología", "Salud", "Manufactura", "Comercio", "Finanzas",
  "Construcción", "Agroindustria", "Educación", "Servicios", "Otro",
];

interface Props {
  data: IntakeData;
  onChange: (d: IntakeData) => void;
  onNext: (d: IntakeData) => void;
  onBack?: () => void;
}

type QuestionId = "nombre" | "empresa" | "sector";

interface Question {
  id: QuestionId;
  index: number;
  question: string;
  hint: string;
  type: "text" | "chips";
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    id: "nombre",
    index: 1,
    question: "¿Nombre completo del representante legal?",
    hint: "Persona autorizada para firmar y vincular a la empresa en este proceso.",
    type: "text",
    placeholder: "Ej. María Camila Rodríguez Muñoz",
  },
  {
    id: "empresa",
    index: 2,
    question: "¿Razón social de la empresa?",
    hint: "Persona jurídica tal como figura en cámara de comercio / RUT.",
    type: "text",
    placeholder: "Ej. Acropolis Labs S.A.S.",
  },
  {
    id: "sector",
    index: 3,
    question: "¿En qué sector opera la empresa?",
    hint: "Selecciona el sector principal de la compañía.",
    type: "chips",
  },
];

export function IntakeStep({ data, onChange, onNext, onBack }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [errors, setErrors] = useState<Partial<Record<QuestionId, string>>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const q = QUESTIONS[currentQ];
  const isLast = currentQ === QUESTIONS.length - 1;
  const progress = ((currentQ) / QUESTIONS.length) * 100;
  const progressDone = ((currentQ + 1) / QUESTIONS.length) * 100;

  useEffect(() => {
    if (q.type === "text") {
      setTimeout(() => inputRef.current?.focus(), 320);
    }
  }, [currentQ, q.type]);

  const validate = useCallback((qId: QuestionId): boolean => {
    const val = data[qId];
    if (!val || !val.trim()) {
      setErrors((e) => ({ ...e, [qId]: "Este campo es requerido" }));
      return false;
    }
    setErrors((e) => ({ ...e, [qId]: undefined }));
    return true;
  }, [data]);

  const goNext = useCallback(() => {
    if (!validate(q.id)) return;
    if (isLast) {
      onNext(data);
      return;
    }
    setDirection("forward");
    setAnimating(true);
    setTimeout(() => {
      setCurrentQ((i) => i + 1);
      setAnimating(false);
    }, 220);
  }, [validate, q.id, isLast, onNext, data]);

  const goBack = () => {
    if (currentQ === 0) {
      onBack?.();
      return;
    }
    setDirection("back");
    setAnimating(true);
    setTimeout(() => {
      setCurrentQ((i) => i - 1);
      setAnimating(false);
    }, 220);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goBack}
          disabled={currentQ === 0 && !onBack}
          className="h-9 px-0 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          ← {currentQ === 0 ? "Volver" : "Anterior"}
        </button>
        <button
          onClick={goNext}
          className="flex items-center gap-2 px-5 h-9 rounded-lg bg-[#4a7c59] text-white text-sm font-semibold hover:bg-[#3f6b4c] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLast ? "Siguiente" : "Continuar"} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-3">Paso 2 · Empresa (PJ)</p>
      {/* Progress bar */}
      <div className="w-full h-0.5 bg-gray-100 rounded-full overflow-hidden mb-12">
        <div
          className="h-full bg-[#BBE795] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressDone}%` }}
        />
      </div>

      {/* Question area — Typeform style */}
      <div
        className={`flex-1 flex flex-col justify-center transition-all duration-220 ${
          animating
            ? direction === "forward"
              ? "opacity-0 translate-y-4"
              : "opacity-0 -translate-y-4"
            : "opacity-100 translate-y-0"
        }`}
        style={{ transitionDuration: "220ms" }}
      >
        {/* Question number + arrow */}
        <div className="flex items-start gap-3 mb-6">
          <div className="flex items-center gap-2 mt-1 shrink-0">
            <span className="text-sm font-bold text-[#1a1a1a] tabular-nums">
              {q.index}
            </span>
            <ArrowRight className="w-4 h-4 text-[#BBE795]" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#1a1a1a] leading-snug tracking-tight">
              {q.question}
            </h2>
            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{q.hint}</p>
          </div>
        </div>

        {/* Answer area */}
        <div className="ml-10">
          {q.type === "text" ? (
            <div className="space-y-3">
              <div className="border-b-2 border-gray-200 focus-within:border-[#BBE795] transition-colors duration-200 pb-2">
                <input
                  ref={inputRef}
                  id={`intake-${q.id}`}
                  type="text"
                  placeholder={q.placeholder}
                  value={data[q.id]}
                  onChange={(e) => {
                    onChange({ ...data, [q.id]: e.target.value });
                    if (errors[q.id]) setErrors((er) => ({ ...er, [q.id]: undefined }));
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full text-lg text-[#1a1a1a] placeholder-gray-300 bg-transparent outline-none font-medium"
                />
              </div>
              {errors[q.id] && (
                <p className="text-xs text-red-400 animate-in fade-in duration-200">
                  {errors[q.id]}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Presiona{" "}
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-500">
                  Enter ↵
                </kbd>{" "}
                para continuar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s, i) => (
                  <button
                    key={s}
                    id={`sector-${s.toLowerCase()}`}
                    onClick={() => {
                      onChange({ ...data, sector: s });
                      setErrors((er) => ({ ...er, sector: undefined }));
                    }}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                      data.sector === s
                        ? "border-[#BBE795] bg-[#BBE795]/10 text-[#1a1a1a]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-[#1a1a1a]"
                    }`}
                  >
                    {data.sector === s && (
                      <span className="flex items-center justify-center w-4 h-4 rounded bg-[#1a1a1a] text-[#BBE795] shrink-0">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 font-bold mr-0.5 tabular-nums">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {s}
                  </button>
                ))}
              </div>
              {errors[q.id] && (
                <p className="text-xs text-red-400 animate-in fade-in duration-200">
                  {errors[q.id]}
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center gap-4 mt-8">
            <button
              id="intake-next"
              onClick={goNext}
              className="flex items-center gap-2 px-6 h-11 rounded-xl bg-[#4a7c59] text-white text-sm font-semibold hover:bg-[#3f6b4c] transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLast ? "Continuar a documentación" : "OK"}
              {isLast ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <span className="text-[#d8f3bf]">✓</span>
              )}
            </button>
            {currentQ > 0 && (
              <button
                onClick={goBack}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
              >
                ← Anterior
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav dots */}
      <div className="flex items-center justify-between pt-12 pb-4">
        <div className="flex items-center gap-2">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentQ
                  ? "w-5 h-2 bg-[#1a1a1a]"
                  : i < currentQ
                  ? "w-2 h-2 bg-[#BBE795]"
                  : "w-2 h-2 bg-gray-200"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 tabular-nums">
          {currentQ + 1} / {QUESTIONS.length}
        </span>
      </div>
    </div>
  );
}
