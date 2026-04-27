"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  Receipt,
  CreditCard,
  Users,
  BarChart2,
  Landmark,
  ChevronRight,
  X,
  Loader2,
  ShieldCheck,
  ScanLine,
  Database,
  Edit3,
  Save,
} from "lucide-react";
import Link from "next/link";

type DocStatus = "pending" | "uploaded" | "reviewing" | "approved";

interface Document {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  requirement: string;
  status: DocStatus;
}

const initialDocs: Document[] = [
  {
    id: "sarlaft",
    icon: FileText,
    title: "Formulario de Vinculación SARLAFT",
    description:
      "Debidamente diligenciado y firmado por el representante legal.",
    requirement: "PDF · Firmado",
    status: "pending",
  },
  {
    id: "camara",
    icon: Building2,
    title: "Certificado de Existencia y Representación Legal",
    description:
      "Expedido por la Cámara de Comercio con vigencia no mayor a 90 días.",
    requirement: "PDF · Vigencia máx. 90 días",
    status: "pending",
  },
  {
    id: "rut",
    icon: Receipt,
    title: "RUT (Registro Único Tributario)",
    description: "Copia actualizada y legible.",
    requirement: "PDF · Actualizado",
    status: "pending",
  },
  {
    id: "cedula",
    icon: CreditCard,
    title: "Documento de Identidad del Representante Legal",
    description: "Copia de la cédula del representante legal.",
    requirement: "PDF o imagen · Ambas caras",
    status: "pending",
  },
  {
    id: "accionaria",
    icon: Users,
    title: "Composición Accionaria",
    description:
      "Documento que identifique a los socios o accionistas con participación igual o superior al 5% (Beneficiario Final).",
    requirement: "PDF · Firmado por Rep. Legal",
    status: "pending",
  },
  {
    id: "estados",
    icon: BarChart2,
    title: "Estados Financieros",
    description: "Generalmente del último corte anual o del año inmediatamente anterior.",
    requirement: "PDF · Certificados por contador",
    status: "pending",
  },
  {
    id: "renta",
    icon: Landmark,
    title: "Declaración de Renta",
    description: "Copia del último periodo gravable disponible.",
    requirement: "PDF · Último periodo gravable",
    status: "pending",
  },
];

const statusConfig: Record<DocStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: {
    label: "Pendiente",
    color: "border-gray-200 text-gray-400",
    icon: Clock,
  },
  uploaded: {
    label: "Cargado",
    color: "border-[#BBE795] text-[#6abf1a]",
    icon: CheckCircle2,
  },
  reviewing: {
    label: "En revisión",
    color: "border-amber-300 text-amber-500",
    icon: AlertCircle,
  },
  approved: {
    label: "Aprobado",
    color: "bg-[#BBE795] text-[#1a1a1a] border-transparent",
    icon: CheckCircle2,
  },
};

function DocCard({
  doc,
  onToggle,
}: {
  doc: Document;
  onToggle: (id: string) => void;
}) {
  const config = statusConfig[doc.status];
  const Icon = doc.icon;
  const StatusIco = config.icon;
  const isUploaded = doc.status !== "pending";

  return (
    <div
      className={`group relative flex gap-4 p-4 rounded-2xl ring-1 transition-all duration-300 cursor-pointer
        ${isUploaded
          ? "ring-[#BBE795]/40 bg-[#F0FEE6]/40 hover:ring-[#BBE795]/60"
          : "ring-gray-100 bg-white hover:ring-[#BBE795]/30 hover:shadow-sm"
        }`}
      onClick={() => onToggle(doc.id)}
    >
      {/* Icon */}
      <div
        className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors duration-300 ${
          isUploaded ? "bg-[#BBE795]/20" : "bg-gray-50 group-hover:bg-[#F0FEE6]"
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-colors duration-300 ${
            isUploaded ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a] leading-snug">{doc.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{doc.description}</p>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] font-semibold h-5 px-2 transition-all duration-300 ${config.color}`}
          >
            <StatusIco className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Requirement tag + Upload action */}
        <div className="flex items-center justify-between mt-3">
          <span className="inline-flex items-center text-[11px] text-gray-400 font-medium gap-1">
            <FileText className="w-3 h-3" />
            {doc.requirement}
          </span>
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 ${
              isUploaded ? "text-[#6abf1a]" : "text-gray-400 group-hover:text-[#6abf1a]"
            }`}
          >
            {isUploaded ? (
              <>
                <span>Documento cargado</span>
                <X className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Cargar documento</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reglas SARLAFT que se validan por documento ────────────────────────────
const SARLAFT_RULES = [
  { label: "Lista OFAC / Clinton", db: "US Treasury" },
  { label: "Lista Consolidada ONU", db: "CSNU · ONU" },
  { label: "PEPs — Personas Expuestas Políticamente", db: "Procuraduría" },
  { label: "CICAD / OEA — Narcotráfico", db: "CICAD · OEA" },
  { label: "Bases de datos DIAN", db: "DIAN" },
  { label: "Listas Policía Nacional", db: "DIJIN" },
  { label: "SAGRILAFT — Beneficiario Final", db: "SFC" },
  { label: "Análisis de riesgo ML/FT", db: "Motor IA" },
];

// ── Campos del formulario SARLAFT ────────────────────────────────────────────
interface SarlaftField {
  id: string;
  label: string;
  section: string;
  type: "text" | "number" | "select" | "date";
  options?: string[];
  required: boolean;
  extractedValue?: string;
  confidence?: "high" | "medium" | "low" | "none";
}

const SARLAFT_FIELDS: SarlaftField[] = [
  // Información General
  { id: "razon_social", label: "Razón Social", section: "general", type: "text", required: true, extractedValue: "Elemento Alpha S.A.S.", confidence: "high" },
  { id: "nit", label: "NIT", section: "general", type: "text", required: true, extractedValue: "901.456.789-1", confidence: "high" },
  { id: "fecha_constitucion", label: "Fecha de Constitución", section: "general", type: "date", required: true, extractedValue: "2021-03-15", confidence: "high" },
  { id: "direccion", label: "Dirección Principal", section: "general", type: "text", required: true, extractedValue: "Cra 15 # 93-75 Of. 501", confidence: "medium" },
  { id: "ciudad", label: "Ciudad", section: "general", type: "text", required: true, extractedValue: "Bogotá D.C.", confidence: "high" },
  { id: "telefono", label: "Teléfono", section: "general", type: "text", required: true, extractedValue: "", confidence: "none" },
  { id: "correo", label: "Correo Electrónico", section: "general", type: "text", required: true, extractedValue: "", confidence: "none" },
  { id: "actividad_economica", label: "Actividad Económica (CIIU)", section: "general", type: "text", required: true, extractedValue: "6201 - Actividades de desarrollo de sistemas informáticos", confidence: "high" },
  
  // Representante Legal
  { id: "rep_nombre", label: "Nombre Completo", section: "representante", type: "text", required: true, extractedValue: "Juan Carlos Mendoza Ríos", confidence: "high" },
  { id: "rep_tipo_doc", label: "Tipo de Documento", section: "representante", type: "select", options: ["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte"], required: true, extractedValue: "Cédula de Ciudadanía", confidence: "high" },
  { id: "rep_numero_doc", label: "Número de Documento", section: "representante", type: "text", required: true, extractedValue: "80.123.456", confidence: "high" },
  { id: "rep_fecha_expedicion", label: "Fecha de Expedición", section: "representante", type: "date", required: true, extractedValue: "", confidence: "none" },
  { id: "rep_lugar_expedicion", label: "Lugar de Expedición", section: "representante", type: "text", required: true, extractedValue: "", confidence: "none" },
  { id: "rep_cargo", label: "Cargo", section: "representante", type: "text", required: true, extractedValue: "Gerente General", confidence: "high" },
  
  // Información Financiera
  { id: "ingresos_mensuales", label: "Ingresos Mensuales (COP)", section: "financiera", type: "number", required: true, extractedValue: "450000000", confidence: "medium" },
  { id: "egresos_mensuales", label: "Egresos Mensuales (COP)", section: "financiera", type: "number", required: true, extractedValue: "320000000", confidence: "medium" },
  { id: "activos_totales", label: "Total Activos (COP)", section: "financiera", type: "number", required: true, extractedValue: "2850000000", confidence: "high" },
  { id: "pasivos_totales", label: "Total Pasivos (COP)", section: "financiera", type: "number", required: true, extractedValue: "980000000", confidence: "high" },
  { id: "patrimonio", label: "Patrimonio (COP)", section: "financiera", type: "number", required: true, extractedValue: "1870000000", confidence: "high" },
  { id: "origen_fondos", label: "Origen de los Fondos", section: "financiera", type: "text", required: true, extractedValue: "", confidence: "none" },
  
  // Beneficiarios Finales
  { id: "bf1_nombre", label: "Beneficiario Final 1 - Nombre", section: "beneficiarios", type: "text", required: true, extractedValue: "María Elena Gómez", confidence: "high" },
  { id: "bf1_documento", label: "Beneficiario Final 1 - Documento", section: "beneficiarios", type: "text", required: true, extractedValue: "52.987.654", confidence: "high" },
  { id: "bf1_participacion", label: "Beneficiario Final 1 - % Participación", section: "beneficiarios", type: "number", required: true, extractedValue: "60", confidence: "high" },
  { id: "bf2_nombre", label: "Beneficiario Final 2 - Nombre", section: "beneficiarios", type: "text", required: false, extractedValue: "Pedro Luis Martínez", confidence: "medium" },
  { id: "bf2_documento", label: "Beneficiario Final 2 - Documento", section: "beneficiarios", type: "text", required: false, extractedValue: "", confidence: "none" },
  { id: "bf2_participacion", label: "Beneficiario Final 2 - % Participación", section: "beneficiarios", type: "number", required: false, extractedValue: "40", confidence: "medium" },
  
  // PEPs
  { id: "es_pep", label: "¿Es PEP o tiene vínculo con PEP?", section: "peps", type: "select", options: ["No", "Sí"], required: true, extractedValue: "No", confidence: "high" },
  { id: "pep_cargo", label: "Cargo Público (si aplica)", section: "peps", type: "text", required: false, extractedValue: "", confidence: "none" },
  { id: "pep_entidad", label: "Entidad Pública (si aplica)", section: "peps", type: "text", required: false, extractedValue: "", confidence: "none" },
  
  // Operaciones Internacionales
  { id: "op_internacionales", label: "¿Realiza operaciones internacionales?", section: "operaciones", type: "select", options: ["No", "Sí"], required: true, extractedValue: "", confidence: "none" },
  { id: "paises_operacion", label: "Países con los que opera", section: "operaciones", type: "text", required: false, extractedValue: "", confidence: "none" },
  { id: "moneda_extranjera", label: "¿Maneja moneda extranjera?", section: "operaciones", type: "select", options: ["No", "Sí"], required: true, extractedValue: "", confidence: "none" },
];

const SECTIONS = [
  { id: "general", title: "Información General de la Empresa", icon: Building2 },
  { id: "representante", title: "Representante Legal", icon: CreditCard },
  { id: "financiera", title: "Información Financiera", icon: BarChart2 },
  { id: "beneficiarios", title: "Beneficiarios Finales", icon: Users },
  { id: "peps", title: "Personas Expuestas Políticamente (PEPs)", icon: ShieldCheck },
  { id: "operaciones", title: "Operaciones Internacionales", icon: Landmark },
];

function getRulesForDoc(docIdx: number) {
  const start = (docIdx * 3) % SARLAFT_RULES.length;
  return [0, 1, 2].map((i) => SARLAFT_RULES[(start + i) % SARLAFT_RULES.length]);
}

// ── Formulario SARLAFT ───────────────────────────────────────────────────────
function SarlaftForm({ onComplete }: { onComplete: () => void }) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    SARLAFT_FIELDS.forEach((f) => {
      initial[f.id] = f.extractedValue || "";
    });
    return initial;
  });
  const [currentSection, setCurrentSection] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const sectionFields = SARLAFT_FIELDS.filter(
    (f) => f.section === SECTIONS[currentSection].id
  );

  const filledInSection = sectionFields.filter((f) => formData[f.id]?.trim()).length;
  const requiredInSection = sectionFields.filter((f) => f.required).length;
  const requiredFilledInSection = sectionFields.filter((f) => f.required && formData[f.id]?.trim()).length;
  const canAdvance = requiredFilledInSection === requiredInSection;

  const totalRequired = SARLAFT_FIELDS.filter((f) => f.required).length;
  const totalRequiredFilled = SARLAFT_FIELDS.filter((f) => f.required && formData[f.id]?.trim()).length;
  const overallProgress = Math.round((totalRequiredFilled / totalRequired) * 100);

  const SectionIcon = SECTIONS[currentSection].icon;

  const getConfidenceBadge = (confidence?: "high" | "medium" | "low" | "none") => {
    if (!confidence || confidence === "none") return null;
    const configs = {
      high: { label: "Auto-detectado", color: "bg-[#BBE795] text-[#1a1a1a]" },
      medium: { label: "Verificar", color: "bg-amber-100 text-amber-700" },
      low: { label: "Revisar", color: "bg-orange-100 text-orange-700" },
    };
    const config = configs[confidence];
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header del formulario */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#BBE795] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#1a1a1a]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Formulario SARLAFT</h2>
            <p className="text-sm text-gray-500">Complete los campos faltantes para finalizar</p>
          </div>
        </div>
        
        {/* Barra de progreso general */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Progreso total</span>
          <span className="text-xs font-bold text-[#6abf1a]">{overallProgress}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#BBE795] to-[#7dd83a]"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Navegación de secciones */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {SECTIONS.map((section, idx) => {
          const sectionFieldsList = SARLAFT_FIELDS.filter((f) => f.section === section.id);
          const sectionRequiredFilled = sectionFieldsList.filter((f) => f.required && formData[f.id]?.trim()).length;
          const sectionRequiredTotal = sectionFieldsList.filter((f) => f.required).length;
          const isComplete = sectionRequiredFilled === sectionRequiredTotal;
          const Icon = section.icon;
          
          return (
            <button
              key={section.id}
              onClick={() => setCurrentSection(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                idx === currentSection
                  ? "bg-[#1a1a1a] text-white shadow-lg"
                  : isComplete
                  ? "bg-[#F0FEE6] text-[#6abf1a] ring-1 ring-[#BBE795]/40"
                  : "bg-white text-gray-500 ring-1 ring-gray-100 hover:ring-gray-200"
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{section.title.split(" ")[0]}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Sección actual */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <SectionIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1a1a1a]">{SECTIONS[currentSection].title}</h3>
              <p className="text-xs text-gray-400">{filledInSection} de {sectionFields.length} campos completados</p>
            </div>
          </div>
          {canAdvance && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6abf1a] bg-[#F0FEE6] px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completo
            </div>
          )}
        </div>

        {/* Campos del formulario */}
        <div className="p-5 space-y-4">
          {sectionFields.map((field) => {
            const originalField = SARLAFT_FIELDS.find((f) => f.id === field.id);
            const hasExtractedValue = originalField?.extractedValue && originalField.extractedValue.trim();
            const isEditing = editingField === field.id;
            const isEmpty = !formData[field.id]?.trim();
            
            return (
              <div key={field.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    {hasExtractedValue && getConfidenceBadge(originalField?.confidence)}
                    {hasExtractedValue && !isEditing && (
                      <button
                        onClick={() => setEditingField(field.id)}
                        className="text-gray-400 hover:text-[#6abf1a] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {field.type === "select" ? (
                  <select
                    value={formData[field.id]}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none ${
                      isEmpty
                        ? "bg-amber-50 ring-2 ring-amber-200 focus:ring-[#BBE795]"
                        : "bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#BBE795]"
                    }`}
                  >
                    <option value="">Seleccionar...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type === "number" ? "text" : field.type}
                    value={formData[field.id]}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={isEmpty ? "Completar este campo..." : ""}
                    className={`w-full px-4 py-3 h-auto rounded-xl text-sm transition-all duration-200 ${
                      isEmpty
                        ? "bg-amber-50 ring-2 ring-amber-200 focus:ring-[#BBE795] placeholder:text-amber-400"
                        : "bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#BBE795]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navegación y acciones */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
          disabled={currentSection === 0}
          className="text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        
        {currentSection < SECTIONS.length - 1 ? (
          <Button
            onClick={() => setCurrentSection((s) => s + 1)}
            disabled={!canAdvance}
            className={`text-sm font-semibold transition-all duration-200 ${
              canAdvance
                ? "bg-[#1a1a1a] text-white hover:bg-black"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            Siguiente sección
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={onComplete}
            disabled={overallProgress < 100}
            className={`text-sm font-semibold transition-all duration-300 ${
              overallProgress === 100
                ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <Save className="w-4 h-4 mr-2" />
            Finalizar vinculación
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Pantalla de verificación animada ─────────────────────────────────────────
function VerificationScreen({ docs, onAnalysisComplete }: { docs: Document[]; onAnalysisComplete: () => void }) {
  const [currentDocIdx, setCurrentDocIdx] = useState(0);
  const [phase, setPhase] = useState<"scanning" | "checking" | "approved">("scanning");
  const [rulesVisible, setRulesVisible] = useState(0);
  const [approvedDocs, setApprovedDocs] = useState<number[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [scanPos, setScanPos] = useState(0);

  // Scan line animation
  useEffect(() => {
    if (phase !== "scanning") { setScanPos(0); return; }
    const interval = setInterval(() => {
      setScanPos((p) => (p >= 100 ? 0 : p + 2));
    }, 18);
    return () => clearInterval(interval);
  }, [phase]);

  // State machine
  useEffect(() => {
    if (allDone) return;
    const rules = getRulesForDoc(currentDocIdx);

    if (phase === "scanning") {
      const t = setTimeout(() => setPhase("checking"), 1400);
      return () => clearTimeout(t);
    }
    if (phase === "checking") {
      if (rulesVisible < rules.length) {
        const t = setTimeout(() => setRulesVisible((r) => r + 1), 650);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("approved"), 500);
      return () => clearTimeout(t);
    }
    if (phase === "approved") {
      const t = setTimeout(() => {
        setApprovedDocs((prev) => [...prev, currentDocIdx]);
        const next = currentDocIdx + 1;
        if (next >= docs.length) {
          setAllDone(true);
        } else {
          setCurrentDocIdx(next);
          setPhase("scanning");
          setRulesVisible(0);
        }
      }, 900);
      return () => clearTimeout(t);
    }
  }, [phase, rulesVisible, currentDocIdx, docs.length, allDone]);

  // Cuando termina, mostrar el formulario después de un delay
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => onAnalysisComplete(), 2000);
      return () => clearTimeout(t);
    }
  }, [allDone, onAnalysisComplete]);

  const currentDoc = docs[currentDocIdx];
  const CurrentIcon = currentDoc?.icon ?? FileText;
  const rules = getRulesForDoc(currentDocIdx);

  if (allDone) {
    return (
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-10 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 rounded-full bg-[#BBE795] flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(187,231,149,0.5)]">
          <ShieldCheck className="w-10 h-10 text-[#1a1a1a]" />
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Análisis completado</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-4">
          Los documentos fueron analizados correctamente. Ahora complete los campos faltantes del formulario SARLAFT.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-[#6abf1a] font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparando formulario...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Encabezado de progreso */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest mb-0.5">Verificación SARLAFT</p>
          <h2 className="text-lg font-bold text-[#1a1a1a]">
            Documento {currentDocIdx + 1} de {docs.length}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full ring-1 ring-blue-100">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          En proceso
        </div>
      </div>

      {/* Animación principal: Documento ↔ SARLAFT */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center min-h-[260px]">

          {/* ── Panel izquierdo: Documento ── */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documentación</p>
            <div className="relative w-full max-w-[180px] mx-auto">
              {/* Documento visual */}
              <div className={`relative rounded-xl overflow-hidden border-2 transition-all duration-500 ${
                phase === "approved" ? "border-[#BBE795] shadow-[0_0_20px_rgba(187,231,149,0.4)]" : "border-gray-200"
              } bg-white p-4 min-h-[180px]`}>
                {/* Scan line */}
                {phase === "scanning" && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#6abf1a] to-transparent opacity-80 transition-none z-10"
                    style={{ top: `${scanPos}%` }}
                  />
                )}
                {/* Document content mockup */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-3 mx-auto transition-colors duration-500 ${
                  phase === "approved" ? "bg-[#BBE795]" : "bg-gray-100"
                }`}>
                  <CurrentIcon className={`w-5 h-5 transition-colors duration-500 ${
                    phase === "approved" ? "text-[#1a1a1a]" : "text-gray-400"
                  }`} />
                </div>
                <div className="space-y-1.5">
                  {[100, 75, 90, 60, 80].map((w, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-colors duration-500 ${
                        phase === "scanning" && scanPos > i * 20
                          ? "bg-[#BBE795]/60"
                          : phase === "approved"
                          ? "bg-[#BBE795]/40"
                          : "bg-gray-100"
                      }`}
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
                {/* Approved badge */}
                {phase === "approved" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#F0FEE6]/80 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-8 h-8 text-[#6abf1a]" />
                      <span className="text-xs font-bold text-[#6abf1a]">Aprobado</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-center text-gray-500 mt-2 font-medium leading-snug">{currentDoc?.title}</p>
            </div>
          </div>

          {/* ── Centro: flujo animado ── */}
          <div className="flex flex-col items-center gap-1 px-1">
            {["↔", "↔", "↔"].map((_, i) => (
              <div
                key={i}
                className={`w-px h-5 rounded-full transition-all duration-300 ${
                  phase === "checking" ? "bg-[#BBE795]" : "bg-gray-200"
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
            <div className={`my-1 rounded-full p-1.5 transition-all duration-500 ${
              phase === "checking" ? "bg-[#BBE795]/20 ring-1 ring-[#BBE795]/40" : "bg-gray-50"
            }`}>
              <Database className={`w-4 h-4 transition-colors duration-300 ${
                phase === "checking" ? "text-[#6abf1a]" : "text-gray-300"
              }`} />
            </div>
            {["↔", "↔", "↔"].map((_, i) => (
              <div
                key={i}
                className={`w-px h-5 rounded-full transition-all duration-300 ${
                  phase === "checking" ? "bg-[#BBE795]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* ── Panel derecho: Reglas SARLAFT ── */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SARLAFT</p>
            {rules.map((rule, i) => {
              const visible = i < rulesVisible || phase === "approved";
              const approved = phase === "approved" || i < rulesVisible;
              return (
                <div
                  key={rule.label}
                  className={`transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
                >
                  <div className={`flex items-start gap-2 p-2.5 rounded-xl ring-1 transition-all duration-300 ${
                    approved
                      ? "bg-[#F0FEE6] ring-[#BBE795]/40"
                      : visible
                      ? "bg-blue-50 ring-blue-100"
                      : "bg-gray-50 ring-gray-100"
                  }`}>
                    <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                      approved ? "bg-[#BBE795]" : "bg-blue-100"
                    }`}>
                      {approved
                        ? <CheckCircle2 className="w-2.5 h-2.5 text-[#1a1a1a]" />
                        : <Loader2 className="w-2.5 h-2.5 text-blue-500 animate-spin" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#1a1a1a] leading-snug">{rule.label}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{rule.db}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Reglas pendientes (placeholders) */}
            {phase === "scanning" && (
              <div className="space-y-2 mt-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-50 ring-1 ring-gray-100 animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Barra de estado inferior */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <ScanLine className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
            phase === "scanning" ? "text-[#6abf1a] animate-pulse" : phase === "checking" ? "text-blue-400" : "text-[#6abf1a]"
          }`} />
          <p className="text-xs text-gray-500 font-medium">
            {phase === "scanning" && "Escaneando documento y extrayendo metadatos..."}
            {phase === "checking" && `Cruzando con bases de datos SARLAFT — ${rulesVisible}/${rules.length} verificaciones`}
            {phase === "approved" && "✓ Documento validado exitosamente"}
          </p>
        </div>
      </div>

      {/* Documentos ya verificados */}
      {approvedDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Verificados</p>
          <div className="grid gap-2">
            {approvedDocs.map((idx) => {
              const d = docs[idx];
              const Icon = d.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[#F0FEE6]/60 ring-1 ring-[#BBE795]/30 animate-in fade-in duration-500">
                  <div className="w-7 h-7 rounded-lg bg-[#BBE795] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#1a1a1a]" />
                  </div>
                  <p className="text-xs font-semibold text-[#1a1a1a] flex-1 min-w-0 truncate">{d.title}</p>
                  <CheckCircle2 className="w-4 h-4 text-[#6abf1a] shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SarlaftPage() {
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const toggleDoc = (id: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: d.status === "pending" ? "uploaded" : "pending" }
          : d
      )
    );
  };

  const handleAnalysisComplete = () => {
    setShowForm(true);
  };

  const handleFormComplete = () => {
    setIsComplete(true);
  };

  const uploaded = docs.filter((d) => d.status !== "pending").length;
  const total = docs.length;
  const progress = Math.round((uploaded / total) * 100);
  const allDone = uploaded === total;

  // Determinar fase actual
  const getCurrentPhase = () => {
    if (isComplete) return "complete";
    if (showForm) return "form";
    if (isVerifying) return "verifying";
    return "upload";
  };
  const phase = getCurrentPhase();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
            </Link>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Onboarding · {phase === "upload" ? "Fase 1" : phase === "verifying" ? "Fase 2" : phase === "form" ? "Fase 3" : "Completado"}
              </p>
              <h1 className="text-base font-semibold text-[#1a1a1a] leading-tight">
                Procedimiento SARLAFT
              </h1>
            </div>
          </div>
          {phase === "upload" && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-semibold text-[#1a1a1a]">{uploaded}</span>
              <span>de {total} documentos</span>
            </div>
          )}
          {phase === "verifying" && (
            <div className="flex items-center gap-2 text-sm text-blue-500 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analizando...</span>
            </div>
          )}
          {phase === "form" && (
            <div className="flex items-center gap-2 text-sm text-amber-500 font-medium">
              <Edit3 className="w-4 h-4" />
              <span>Completar formulario</span>
            </div>
          )}
          {phase === "complete" && (
            <div className="flex items-center gap-2 text-sm text-[#6abf1a] font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Vinculación completada</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {phase === "upload" && (
          <>
            {/* Hero */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-[#6abf1a]" />
                <span className="text-sm font-semibold text-[#6abf1a] uppercase tracking-wider">
                  Vinculación Empresarial
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-2">
                Documentos requeridos
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                Para cumplir con la normativa SARLAFT, carga los siguientes
                documentos. Todos los archivos deben estar vigentes y ser legibles.
              </p>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  Progreso de carga
                </span>
                <span
                  className={`text-sm font-bold ${
                    allDone ? "text-[#6abf1a]" : "text-gray-400"
                  }`}
                >
                  {progress}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-[#BBE795] to-[#7dd83a]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {allDone
                  ? "✓ Todos los documentos han sido cargados"
                  : `${total - uploaded} documento${total - uploaded !== 1 ? "s" : ""} pendiente${total - uploaded !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Document Cards */}
            <div className="grid gap-3 mb-8">
              {docs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onToggle={toggleDoc} />
              ))}
            </div>

            {/* Footer CTA */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white ring-1 ring-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  {allDone ? "¡Listo para analizar!" : "Completa todos los documentos"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 max-w-sm">
                  {allDone
                    ? "Analizaremos los documentos y pre-llenaremos el formulario SARLAFT."
                    : `Faltan ${total - uploaded} de ${total} documentos para continuar.`}
                </p>
              </div>
              <Button
                disabled={!allDone}
                onClick={() => setIsVerifying(true)}
                className={`flex items-center gap-2 font-semibold transition-all duration-300 ${
                  allDone
                    ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Iniciar análisis
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
        
        {phase === "verifying" && (
          <VerificationScreen docs={docs} onAnalysisComplete={handleAnalysisComplete} />
        )}
        
        {phase === "form" && (
          <SarlaftForm onComplete={handleFormComplete} />
        )}
        
        {phase === "complete" && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-10 text-center animate-in fade-in duration-700">
            <div className="w-20 h-20 rounded-full bg-[#BBE795] flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(187,231,149,0.5)]">
              <ShieldCheck className="w-10 h-10 text-[#1a1a1a]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Vinculación SARLAFT Completada</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-2">
              La información ha sido validada exitosamente contra las listas restrictivas y cumple con la normativa SARLAFT.
            </p>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
              El expediente digital ha sido generado y está listo para su revisión final.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-8 max-w-sm mx-auto">
              {SARLAFT_RULES.slice(0, 6).map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-xs text-left bg-[#F0FEE6] rounded-lg px-3 py-2 ring-1 ring-[#BBE795]/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6abf1a] shrink-0" />
                  <span className="text-gray-600 font-medium">{r.db}</span>
                </div>
              ))}
            </div>
            <Link href="/">
              <Button className="bg-[#1a1a1a] text-white hover:bg-black shadow-lg font-semibold">
                Volver al panel principal
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
