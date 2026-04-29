import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  Briefcase,
  FileBarChart,
  ChevronRight,
  CheckCircle2,
  Clock,
  Lock,
} from "lucide-react";

interface TimelineItem {
  icon: React.ElementType;
  label: string;
  description: string;
  link: string;
  href?: string;
}

const timelineSteps: {
  phase: number;
  title: string;
  subtitle: string;
  status: "active" | "pending" | "locked";
  date: string;
  description: string;
  items: TimelineItem[];
}[] = [
  {
    phase: 1,
    title: "Onboarding",
    subtitle: "Entrevista · KYC · SARLAFT · Portafolio",
    status: "active" as const,
    date: "Fase 1",
    description:
      "Proceso de vinculación del cliente: formulario de datos básicos, entrevista de objetivos con IA de voz, carga de documentos KYC + SARLAFT, y recomendación de portafolio personalizada.",
    items: [
      {
        icon: UserCheck,
        label: "Iniciar proceso de vinculación",
        description: "Datos · Entrevista de voz · Documentos · Portafolio — todo en un solo flujo",
        link: "Comenzar",
        href: "/onboarding",
      },
      {
        icon: FileBarChart,
        label: "Simulación SARLAFT",
        description: "Carga documentos · IA extrae datos · Completa formularios · Exporta PDF",
        link: "Ver simulación",
        href: "/onboarding/sarlaft",
      },
    ],
  },
  {
    phase: 2,
    title: "Front Office",
    subtitle: "Panel de Portafolios",
    status: "pending" as const,
    date: "Fase 2",
    description:
      "Acceso al panel principal donde el cliente puede visualizar su portafolio asignado, rendimientos y opciones disponibles.",
    items: [
      {
        icon: Briefcase,
        label: "Portafolios de Inversión",
        description:
          "Visualización y seguimiento del portafolio según perfil de riesgo",
        link: "Ver portafolios",
        href: "/portfolio",
      },
    ],
  },
  {
    phase: 3,
    title: "Reporting & Customer Support",
    subtitle: "Reportes y Soporte al Cliente",
    status: "locked" as const,
    date: "Fase 3",
    description:
      "Generación de reportes financieros detallados y acceso a soporte personalizado para el cliente.",
    items: [
      {
        icon: FileBarChart,
        label: "Reportes Personalizados",
        description:
          "Generación de estados de cuenta y reportes de rendimiento a la medida",
        link: "Generar reportes",
      },
    ],
  },
];

function StatusIcon({ status }: { status: "active" | "pending" | "locked" }) {
  if (status === "active") {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#BBE795] shadow-[0_0_16px_rgba(187,231,149,0.4)]">
        <CheckCircle2 className="w-5 h-5 text-[#1a1a1a]" />
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F0FEE6] border-2 border-[#BBE795]">
        <Clock className="w-5 h-5 text-[#6abf1a]" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200">
      <Lock className="w-5 h-5 text-gray-400" />
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "pending" | "locked" }) {
  if (status === "active") {
    return (
      <Badge className="bg-[#BBE795] text-[#1a1a1a] border-none font-semibold">
        En Progreso
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-[#BBE795] text-[#6abf1a] font-semibold">
        Pendiente
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-gray-300 text-gray-400 font-semibold">
      Bloqueado
    </Badge>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">
              Elemento
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Proceso de vinculación del cliente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-[#BBE795] animate-pulse" />
              <span>1 de 3 fases completadas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#BBE795] to-[#7dd83a] rounded-full transition-all duration-700 ease-out"
            style={{ width: "33%" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Onboarding</span>
          <span>Front Office</span>
          <span>Reporting</span>
        </div>
      </div>

      {/* Timeline */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="relative">
          {timelineSteps.map((step, index) => (
            <div key={step.phase} className="relative flex gap-6">
              {/* Timeline Line + Icon */}
              <div className="flex flex-col items-center">
                <StatusIcon status={step.status} />
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 my-3 rounded-full ${
                      step.status === "active"
                        ? "bg-gradient-to-b from-[#BBE795] to-[#BBE795]/20"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-12">
                {/* Phase Header */}
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    {step.date}
                  </span>
                  <StatusBadge status={step.status} />
                </div>
                <h2 className="text-xl font-semibold text-[#1a1a1a] tracking-tight">
                  {step.title}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5 mb-4">
                  {step.subtitle}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed mb-5 max-w-2xl">
                  {step.description}
                </p>

                {/* Items */}
                <div className="grid gap-3">
                  {step.items.map((item) => {
                    const Icon = item.icon;
                    const cardClass = `group flex items-center gap-4 px-4 py-3 rounded-xl ring-1 ring-foreground/10 cursor-pointer transition-all duration-300 hover:shadow-md ${
                      step.status === "locked"
                        ? "opacity-50 pointer-events-none"
                        : "hover:ring-[#BBE795]/40"
                    } ${
                      step.status === "active"
                        ? "bg-white"
                        : "bg-white/70"
                    }`;
                    const inner = (
                      <>
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
                            step.status === "active"
                              ? "bg-[#F0FEE6]"
                              : "bg-gray-50"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              step.status === "active"
                                ? "text-[#6abf1a]"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a]">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-[#6abf1a] opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                          <span>{item.link}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </>
                    );
                    return item.href ? (
                      <Link key={item.label} href={item.href} className={cardClass}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={item.label} className={cardClass}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
