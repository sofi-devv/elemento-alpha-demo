"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildSagrilaftHtml } from "@/lib/sarlaft/templates/sagrilaft";
import { buildFatcaCrsHtml } from "@/lib/sarlaft/templates/fatcaCrs";
import { buildVinculacionHtml } from "@/lib/sarlaft/templates/vinculacion";
import type { OcrReportItem } from "@/lib/sarlaft/ocrTypes";
import type { SarlaftPackage } from "@/lib/sarlaft/schema";
import { computeMissingFields, hasMissingFields } from "@/lib/sarlaft/missingFields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function FormsPreview({
  value,
  onChange,
  onGeneratePdf,
  generating,
  ocrReport,
}: {
  value: SarlaftPackage;
  onChange: (p: SarlaftPackage) => void;
  onGeneratePdf: () => Promise<void>;
  generating?: boolean;
  ocrReport?: OcrReportItem[] | null;
}) {
  const ocrCount = ocrReport?.filter((r) => r.ocrUsed).length ?? 0;
  const h1 = useMemo(() => buildSagrilaftHtml(value.formulario_1), [value.formulario_1]);
  const h2 = useMemo(() => buildFatcaCrsHtml(value.formulario_2), [value.formulario_2]);
  const h3 = useMemo(() => buildVinculacionHtml(value.formulario_3), [value.formulario_3]);
  const missing = useMemo(() => computeMissingFields(value), [value]);
  const canPdf = !hasMissingFields(value);

  return (
    <div className="space-y-4">
      {ocrCount > 0 ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">OCR en documentos</p>
          <p className="text-amber-900/80 mt-1">
            Se aplicó lectura por OCR a {ocrCount} documento{ocrCount === 1 ? "" : "s"} (escaneo o poca capa
            de texto). Revisa con atención los datos extraídos.
          </p>
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white ring-1 ring-gray-100">
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">Vista previa (formato PDF)</p>
          <p className="text-xs text-gray-500">
            {missing.length
              ? `Faltan ${missing.length} campo(s) obligatorio(s) antes de exportar.`
              : "Puedes ajustar datos clave abajo o generar el ZIP."}
          </p>
        </div>
        <Button
          className="bg-[#1a1a1a] text-white shrink-0"
          disabled={!canPdf || generating}
          onClick={onGeneratePdf}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Descargar PDFs (ZIP)
        </Button>
      </div>

      <QuickEdit value={value} onChange={onChange} />

      <Tabs defaultValue="f1" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="f1" className="text-xs sm:text-sm">
            SAGRILAFT
          </TabsTrigger>
          <TabsTrigger value="f2" className="text-xs sm:text-sm">
            FATCA / CRS
          </TabsTrigger>
          <TabsTrigger value="f3" className="text-xs sm:text-sm">
            Vinculación PJ
          </TabsTrigger>
        </TabsList>
        <TabsContent value="f1" className="mt-3">
          <PreviewFrame key={h1} html={h1} title="SAGRILAFT" />
        </TabsContent>
        <TabsContent value="f2" className="mt-3">
          <PreviewFrame key={h2} html={h2} title="FATCA" />
        </TabsContent>
        <TabsContent value="f3" className="mt-3">
          <PreviewFrame key={h3} html={h3} title="Vinculación" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PreviewFrame({ html, title }: { html: string; title: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="h-[480px] w-full">
        <iframe
          title={title}
          className="w-full h-full border-0"
          srcDoc={html}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}

function QuickEdit({ value, onChange }: { value: SarlaftPackage; onChange: (p: SarlaftPackage) => void }) {
  const [local, setLocal] = useState<SarlaftPackage>(value);
  useEffect(() => setLocal(value), [value]);

  const patch = useCallback(
    (updater: (d: SarlaftPackage) => void) => {
      setLocal((prev) => {
        const n = JSON.parse(JSON.stringify(prev)) as SarlaftPackage;
        updater(n);
        onChange(n);
        return n;
      });
    },
    [onChange]
  );

  return (
    <div className="p-4 rounded-xl bg-[#F0FEE6]/30 ring-1 ring-[#BBE795]/30 space-y-4">
      <p className="text-sm font-semibold text-[#1a1a1a]">Edición rápida</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <Field
          label="Razón social (F.1 y F.2)"
          value={local.formulario_1.nombre_completo_razon_social}
          onValue={(v) =>
            patch((d) => {
              d.formulario_1.nombre_completo_razon_social = v;
              d.formulario_2.razon_social = v;
            })
          }
        />
        <Field
          label="NIT (F.1 / F.2)"
          value={local.formulario_1.tipo_y_numero_identificacion}
          onValue={(v) =>
            patch((d) => {
              d.formulario_1.tipo_y_numero_identificacion = v;
              d.formulario_2.identificacion_tributaria = v.replace(/^NIT\s*/i, "").trim();
            })
          }
        />
        <Field
          label="País constitución fiscal (F.2)"
          value={local.formulario_2.pais_constitucion_fiscal}
          onValue={(v) => patch((d) => (d.formulario_2.pais_constitucion_fiscal = v))}
        />
        <Field
          label="Representante / ordenantes (F.3)"
          value={local.formulario_3.representantes_ordenates}
          onValue={(v) => patch((d) => (d.formulario_3.representantes_ordenates = v))}
        />
      </div>
    </div>
  );
}

function Field({ label, value, onValue }: { label: string; value: string; onValue: (s: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-gray-500">{label}</Label>
      <Input value={value} onChange={(e) => onValue(e.target.value)} className="h-9" />
    </div>
  );
}
