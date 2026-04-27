"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Inicializar Gemini API — NEXT_PUBLIC_ para que esté disponible en el cliente
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
});

export interface PortfolioRecommendation {
  portfolio: "conservador" | "moderado" | "agresivo";
  nombre: string;
  perfil: string;
  plazo: string;
  razon: string;
  monto?: string;
}

function buildSystemInstruction(financialContext?: string, intakeData?: { nombre: string; empresa: string; sector: string }): string {
  const financialBlock = financialContext
    ? `\n\nCONTEXTO FINANCIERO DEL CLIENTE (extraído de sus estados financieros):\n---\n${financialContext}\n---\nUsa estos datos para personalizar y justificar la recomendación de portafolio.`
    : "";

  const clientBlock = intakeData
    ? `\n\nINFORMACIÓN DEL CLIENTE:\n- Nombre: ${intakeData.nombre}\n- Empresa: ${intakeData.empresa}\n- Sector: ${intakeData.sector}\nDirigete al cliente por su nombre y menciona su empresa cuando sea relevante.`
    : "";

  return `Eres el asesor virtual de Elemento Alpha, plataforma colombiana de Fondos de Inversión Colectiva (FIC).
Tu misión es realizar un perfilamiento de riesgo con exactamente 5 preguntas y al final enrutar al cliente al portafolio más adecuado.
Habla en español colombiano. Sé conciso, empático y profesional. NUNCA hagas más de una pregunta a la vez. ESPERA la respuesta antes de continuar.${clientBlock}${financialBlock}

GUION (sigue este orden estrictamente, una pregunta a la vez):

BIENVENIDA: Saluda al cliente por su nombre, menciona su empresa y dile que le harás 5 preguntas cortas para recomendarle el portafolio ideal.

P1 — OBJETIVO: "¿Cuál es el principal objetivo de esta inversión? Por ejemplo: preservar el capital, hacer crecer el patrimonio, o financiar una meta específica."

P2 — MONTO Y HORIZONTE: "¿Cuánto planean invertir aproximadamente, y por cuánto tiempo? ¿Estamos hablando de meses o años?"

P3 — TOLERANCIA AL RIESGO: "Si la inversión bajara un 10% en un mes, ¿qué haría la empresa? ¿Retirarían el dinero, esperarían la recuperación, o aprovecharían para invertir más?"

P4 — EXPERIENCIA Y LIQUIDEZ: "¿La empresa ha invertido antes en fondos u otros instrumentos? Y, ¿necesitan acceso rápido a ese dinero en algún momento?"

P5 — SITUACIÓN FINANCIERA: "¿Este monto representa una parte pequeña o significativa del patrimonio de la empresa? ¿Tienen flujo de caja estable actualmente?"

IMPORTANTE: El usuario puede terminar la conversación cuando quiera diciendo que ya terminó o que quiere continuar. Si el usuario indica que quiere parar, despídete amablemente, presenta tu recomendación provisional y emite el bloque PORTFOLIO.

DESPUÉS de P5 (o si el usuario quiere terminar), da una conclusión breve en voz (2 frases máximo) y termina con EXACTAMENTE este bloque JSON en una sola línea sin formato adicional:
PORTFOLIO:{"portfolio":"conservador|moderado|agresivo","nombre":"FIC Conservador|FIC Equilibrio|FIC Crecimiento","perfil":"Conservador|Moderado|Agresivo","plazo":"corto plazo|mediano plazo|largo plazo","razon":"razón concreta en 1 frase","monto":"monto mencionado o no especificado"}

REGLAS DE ROUTING:
- conservador: preservar capital + corto plazo + retiraría ante caída + necesitan liquidez + monto es parte importante del patrimonio
- moderado: crecer moderadamente + mediano plazo + esperarían + algo de experiencia + flujo estable
- agresivo: maximizar retorno + largo plazo + invertirían más ante caída + experiencia previa + flujo sólido y diversificado`;
}

interface UseVoiceAgentOptions {
  voiceName?: string;
  financialContext?: string;
  intakeData?: { nombre: string; empresa: string; sector: string };
  onRecommendation?: (rec: PortfolioRecommendation) => void;
}

export function useVoiceAgent({
  voiceName = "Zephyr",
  financialContext,
  intakeData,
  onRecommendation,
}: UseVoiceAgentOptions = {}) {
  const transcriptBufferRef = useRef<string>("");
  const onRecommendationRef = useRef(onRecommendation);
  onRecommendationRef.current = onRecommendation;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Todas las referencias de recursos — refs NO causan re-renders
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  // ── Funciones internas (sin useCallback - se usan via ref) ────────────────

  const stopAudioPlaybackInternal = () => {
    activeSourcesRef.current.forEach((s) => {
      try { s.stop(); } catch (_e) { /* ya detenido */ }
    });
    activeSourcesRef.current = [];
    if (playAudioContextRef.current) {
      nextPlayTimeRef.current = playAudioContextRef.current.currentTime;
    }
  };

  const cleanupInternal = () => {
    // Cerrar sesión de Gemini
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        try { session.close(); } catch (_e) { /* ignorar */ }
      });
      sessionRef.current = null;
    }
    // Apagar micrófono
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    // Cerrar contexto de grabación
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    // Detener reproducción
    stopAudioPlaybackInternal();
    // Cerrar contexto de reproducción
    if (playAudioContextRef.current) {
      playAudioContextRef.current.close().catch(() => { });
      playAudioContextRef.current = null;
    }
  };

  // Guardar cleanup en ref para que el useEffect siempre tenga la versión actual
  const cleanupRef = useRef(cleanupInternal);
  cleanupRef.current = cleanupInternal;

  // ── Reproducir chunk PCM base64 a 24kHz ───────────────────────────────────
  const playBase64Pcm = useCallback((base64: string) => {
    if (!playAudioContextRef.current) return;
    const ctx = playAudioContextRef.current;

    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32Array.length, 24000);
    buffer.getChannelData(0).set(float32Array);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += buffer.duration;

    activeSourcesRef.current.push(source);
    setIsSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(
        (s) => s !== source
      );
      if (activeSourcesRef.current.length === 0) {
        setIsSpeaking(false);
      }
    };
  }, []);

  // ── Finalizar sesión (estable — sin deps que cambien) ─────────────────────
  const endSession = useCallback(() => {
    cleanupRef.current();
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  }, []); // ← vacío: cleanupRef.current siempre tiene la versión actualizada

  // ── Iniciar sesión Live ───────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // 1. Setup Audio Playback Context (24kHz — lo que devuelve Gemini)
      playAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayTimeRef.current = playAudioContextRef.current.currentTime;

      // 2. Setup Audio Capture Context (16kHz — lo que espera Gemini)
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // AudioWorklet para convertir el mic a PCM16
      const workletCode = `
        class AudioRecorder extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0) {
              const channelData = input[0];
              const pcm16 = new Int16Array(channelData.length);
              for (let i = 0; i < channelData.length; i++) {
                let s = Math.max(-1, Math.min(1, channelData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              this.port.postMessage(pcm16);
            }
            return true;
          }
        }
        registerProcessor('audio-recorder', AudioRecorder);
      `;
      const blob = new Blob([workletCode], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContextRef.current.audioWorklet.addModule(workletUrl);

      const recorderNode = new AudioWorkletNode(
        audioContextRef.current,
        "audio-recorder"
      );

      // 3. Conectar a Gemini Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsConnected(true);

            // Pedirle a Gemini que inicie la conversación sin que el usuario tenga que hablar primero
            sessionPromise.then(session => {
              try {
                session.sendClientContent({
                  turns: [{ role: "user", parts: [{ text: "Hola, acabo de entrar a la llamada. Por favor salúdame por mi nombre y empieza la entrevista según tus instrucciones." }] }],
                  turnComplete: true,
                });
              } catch (_e) {
                // Algunas versiones del SDK no soportan el saludo inicial — el usuario puede hablar primero
                console.warn("sendClientContent not available on this SDK version");
              }
            });

            // Configurar envío de audio del mic → Gemini
            recorderNode.port.onmessage = (e) => {
              const pcm16 = e.data;
              const buffer = new ArrayBuffer(pcm16.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(i * 2, pcm16[i], true);
              }
              let binary = "";
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = window.btoa(binary);

              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  audio: {
                    data: base64,
                    mimeType: "audio/pcm;rate=16000",
                  },
                });
              });
            };

            source.connect(recorderNode);
            recorderNode.connect(audioContextRef.current!.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              stopAudioPlaybackInternal();
              setIsSpeaking(false);
            }
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                playBase64Pcm(part.inlineData.data);
              }
              // Detect PORTFOLIO tag in text transcripts
              if (part.text) {
                transcriptBufferRef.current += part.text;
                const match = transcriptBufferRef.current.match(/PORTFOLIO:(\{.*?\})/);
                if (match) {
                  try {
                    const rec: PortfolioRecommendation = JSON.parse(match[1]);
                    onRecommendationRef.current?.(rec);
                    transcriptBufferRef.current = "";
                  } catch { /* ignore parse errors */ }
                }
              }
            }
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            setError("Error de conexión. Intenta de nuevo.");
            cleanupRef.current();
            setIsConnected(false);
            setIsConnecting(false);
            setIsSpeaking(false);
          },
          onclose: () => {
            console.log("Sesión Gemini cerrada");
            cleanupRef.current();
            setIsConnected(false);
            setIsConnecting(false);
            setIsSpeaking(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          systemInstruction: buildSystemInstruction(financialContext, intakeData),
        },
      });

      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error("Failed to start call:", err);
      setError("No se pudo acceder al micrófono o conectar con la IA.");
      cleanupRef.current();
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [voiceName, financialContext, intakeData, playBase64Pcm]);

  // Cleanup al desmontar — deps vacío, usa ref
  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);

  return {
    startSession,
    endSession,
    isConnected,
    isConnecting,
    isSpeaking,
    error,
  };
}
