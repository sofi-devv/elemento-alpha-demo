"use client";

import { useState, useRef, useCallback } from "react";
import {
  Building2, Receipt, CreditCard, Users, BarChart2, Landmark,
  FileText, Upload, X, ChevronRight, ArrowLeft, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntakeData } from "@/app/onboarding/page";

type DocStatus = "pending" | "uploaded";

interface Doc {
  id: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  req: string;
  status: DocStatus;
  file?: File;
  required: boolean;
}

const INITIAL_DOCS: Doc[] = [
  { id: "cedula", icon: CreditCard, title: "Documento de Identidad", desc: "Cédula del representante legal — ambas caras.", req: "PDF o imagen", status: "pending", required: true },
  { id: "rut", icon: Receipt, title: "RUT", desc: "Registro Único Tributario actualizado.", req: "PDF · Actualizado", status: "pending", required: true },
  { id: "camara", icon: Building2, title: "Cámara de Comercio", desc: "Certificado de existencia con vigencia ≤ 90 días.", req: "PDF · Vigencia 90 días", status: "pending", required: true },
  { id: "estados", icon: BarChart2, title: "Estados Financieros", desc: "Último corte anual certificado por contador.", req: "PDF · Certificados", status: "pending", required: false },
  { id: "accionaria", icon: Users, title: "Composición Accionaria", desc: "Socios con participación ≥ 5%.", req: "PDF · Firmado", status: "pending", required: false },
  { id: "renta", icon: Landmark, title: "Declaración de Renta", desc: "Último periodo gravable.", req: "PDF · Último periodo", status: "pending", required: false },
];

interface Props {
  intake: IntakeData;
  onNext: () => void;
  onBack: () => void;
}

function DocCard({ doc, onSelect, onRemove }: { doc: Doc; onSelect: (id: string, f: File) => void; onRemove: (id: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = doc.icon;
  const uploaded = doc.status === "uploaded";

  return (
    <div
      onClick={() => uploaded ? onRemove(doc.id) : inputRef.current?.click()}
      className={`group flex gap-4 p-4 rounded-2xl ring-1 transition-all duration-300 cursor-pointer ${
        uploaded ? "ring-[#BBE795]/40 bg-[#F0FEE6]/40" : "ring-gray-100 bg-white hover:ring-[#BBE795]/30 hover:shadow-sm"
      }`}
    >
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(doc.id, f); e.target.value = ""; }}
      />
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors ${uploaded ? "bg-[#BBE795]/20" : "bg-gray-50 group-hover:bg-[#F0FEE6]"}`}>
        <Icon className={`w-5 h-5 transition-colors ${uploaded ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#1a1a1a]">{doc.title}</p>
          {doc.required && <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Requerido</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <FileText className="w-3 h-3" /> {doc.req}
          </span>
          <span className={`flex items-center gap-1 text-xs font-semibold transition-colors ${uploaded ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"}`}>
            {uploaded ? (
              <><span className="truncate max-w-[100px]">{doc.file?.name}</span><X className="w-3.5 h-3.5" /></>
            ) : (
              <><Upload className="w-3.5 h-3.5" /><span>Cargar</span></>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DocsStep({ intake, onNext, onBack }: Props) {
  const [docs, setDocs] = useState<Doc[]>(INITIAL_DOCS);

  const onSelect = useCallback((id: string, file: File) => {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, status: "uploaded" as DocStatus, file } : d));
  }, []);

  const onRemove = useCallback((id: string) => {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, status: "pending" as DocStatus, file: undefined } : d));
  }, []);

  const uploaded = docs.filter((d) => d.status === "uploaded");
  const requiredDone = docs.filter((d) => d.required && d.status === "uploaded").length;
  const requiredTotal = docs.filter((d) => d.required).length;
  const canContinue = requiredDone === requiredTotal;
  const pct = Math.round((uploaded.length / docs.length) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Documentos para {intake.empresa}</h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Sube los documentos requeridos para completar la vinculación KYC + SARLAFT.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-4 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-[#1a1a1a]">Progreso de carga</span>
          <span className={`font-bold ${canContinue ? "text-[#6abf1a]" : "text-gray-400"}`}>{pct}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#BBE795] to-[#7dd83a] transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {requiredDone} de {requiredTotal} requeridos · {uploaded.length} de {docs.length} totales
        </p>
      </div>

      {/* Required docs */}
      <div>
        <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Documentos obligatorios</p>
        <div className="grid gap-3">
          {docs.filter((d) => d.required).map((d) => (
            <DocCard key={d.id} doc={d} onSelect={onSelect} onRemove={onRemove} />
          ))}
        </div>
      </div>

      {/* Optional docs */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Documentos opcionales (recomendados)</p>
        <div className="grid gap-3">
          {docs.filter((d) => !d.required).map((d) => (
            <DocCard key={d.id} doc={d} onSelect={onSelect} onRemove={onRemove} />
          ))}
        </div>
      </div>

      {canContinue && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#F0FEE6] ring-1 ring-[#BBE795]/40 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#6abf1a]" />
          <p className="text-sm font-medium text-[#1a1a1a]">Documentos obligatorios completos — ¡puedes continuar!</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-gray-700 flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
        <Button
          id="docs-next"
          onClick={onNext}
          disabled={!canContinue}
          className={`rounded-xl px-6 h-10 font-semibold text-sm flex items-center gap-2 transition-all duration-300 ${
            canContinue ? "bg-[#1a1a1a] text-white hover:bg-black shadow-md" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Ver mi portafolio <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
