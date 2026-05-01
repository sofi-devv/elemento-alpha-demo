"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, CheckCircle2, FileStack, House, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormsPreview } from "@/components/sarlaft/FormsPreview";
import { FieldByFieldForm } from "@/components/sarlaft/FieldByFieldForm";
import type { MissingFieldRef, SarlaftPackage } from "@/lib/sarlaft/schema";
import { computeMissingFields } from "@/lib/sarlaft/missingFields";
import type { OcrReportItem } from "@/lib/sarlaft/ocrTypes";

const DOCUMENT_ITEMS = [
  "Paquete SARLAFT / FATCA / CRS / Vinculación (PDF editables y ZIP)",
  "Documentación cargada en ingesta (RUT, cámara de comercio, otros)",
  "Verificación KYC del representante legal",
];

interface Props {
  sarlaftPkg: SarlaftPackage;
  missingFields: MissingFieldRef[];
  ocrReport: OcrReportItem[] | null;
  onSarlaftChange: (p: SarlaftPackage) => void;
  onMissingResolved: (missing: MissingFieldRef[]) => void;
  onGeneratePdf: () => Promise<void>;
  generating: boolean;
  onBack: () => void;
  onRestart: () => void;
}

export function SarlaftStep({
  sarlaftPkg,
  missingFields,
  ocrReport,
  onSarlaftChange,
  onMissingResolved,
  onGeneratePdf,
  generating,
  onBack,
  onRestart,
}: Props) {
  const [phase, setPhase] = useState<"missing" | "preview">(() =>
    missingFields.length > 0 ? "missing" : "preview"
  );

  const handleWizardComplete = useCallback(
    (updated: SarlaftPackage) => {
      onSarlaftChange(updated);
      onMissingResolved(computeMissingFields(updated));
      setPhase("preview");
    },
    [onSarlaftChange, onMissingResolved]
  );

  const handlePackageUpdateFromWizard = useCallback(
    (p: SarlaftPackage) => {
      onSarlaftChange(p);
    },
    [onSarlaftChange]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="h-9 px-0 text-gray-500">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
        </Button>
        <Link href="/" className="inline-flex">
          <Button variant="outline" className="h-9 px-3 gap-1.5 text-gray-600">
            <House className="h-4 w-4" /> Home
          </Button>
        </Link>
      </div>

      <header>
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-1">Paso 7 · SARLAFT</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Documentación regulatoria</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xl">
          {phase === "missing"
            ? "Completa los campos que no se pudieron inferir de tus documentos ni de la entrevista."
            : "Revisa, ajusta y exporta los formularios para cerrar el proceso de vinculación."}
        </p>
      </header>

      <div className="rounded-lg border border-[#BBE795] bg-[#F0FEE6]/50 px-4 py-3 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#4a7c59] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">Portafolio aceptado</p>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            Ya puedes revisar el paquete regulatorio y completar el envío.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <FileStack className="w-5 h-5 text-[#4a7c59]" />
          <p className="text-sm font-bold text-[#1a1a1a]">Documentación que puedes enviar</p>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          {DOCUMENT_ITEMS.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-[#4a7c59] shrink-0 mt-0.5">·</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {phase === "missing" && (
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Información pendiente ({missingFields.length})
          </p>
          <FieldByFieldForm
            package={sarlaftPkg}
            missing={missingFields}
            onComplete={handleWizardComplete}
            onUpdate={handlePackageUpdateFromWizard}
          />
        </div>
      )}

      {phase === "preview" && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Formularios SARLAFT (editables)
          </p>
          <FormsPreview
            value={sarlaftPkg}
            onChange={onSarlaftChange}
            onGeneratePdf={onGeneratePdf}
            generating={generating}
            ocrReport={ocrReport}
          />
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={onRestart}
        className="w-full h-9 rounded-lg text-sm text-gray-500 hover:text-gray-700 gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Reiniciar proceso
      </Button>
    </div>
  );
}
