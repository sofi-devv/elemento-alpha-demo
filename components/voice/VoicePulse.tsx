"use client";

/** Pulso visual durante reproducción del agente de voz (compartido onboarding / portafolio). */
export function VoicePulse({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
      {speaking && (
        <>
          <span
            className="absolute inline-flex h-24 w-24 rounded-full bg-[#BBE795]/20 animate-ping"
            style={{ animationDuration: "1.8s" }}
          />
          <span
            className="absolute inline-flex h-16 w-16 rounded-full bg-[#BBE795]/30 animate-ping"
            style={{ animationDuration: "1.8s", animationDelay: "0.4s" }}
          />
        </>
      )}
      <span
        className={`absolute inline-flex h-16 w-16 rounded-full border-2 transition-all duration-500 ${
          speaking ? "border-[#4a7c59] scale-110" : "border-[#BBE795]/40"
        }`}
      />
      <span
        className={`absolute inline-flex h-10 w-10 rounded-full transition-all duration-500 ${
          speaking ? "bg-[#BBE795]/40 scale-110" : "bg-[#BBE795]/15"
        }`}
      />
      <span
        className={`relative inline-flex h-5 w-5 rounded-full bg-[#4a7c59] transition-all duration-300 ${
          speaking ? "scale-125 shadow-[0_0_18px_rgba(74,124,89,0.55)]" : ""
        }`}
      />
    </div>
  );
}
