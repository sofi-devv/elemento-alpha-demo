"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

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

function buildSystemInstruction(
  financialContext?: string,
  intakeData?: { nombre: string; empresa: string; sector: string }
): string {
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

BIENVENIDA: Saluda al cliente por su nombre, menciona su empresa y dile que le harás 5 preguntas cortas para recomendarle el portafolio ideal. INICIA INMEDIATAMENTE al conectarte, sin esperar que el usuario hable primero.

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
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Refs de recursos ──────────────────────────────────────────────────────
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);      // captura 16kHz
  const playAudioContextRef = useRef<AudioContext | null>(null);  // reproducción 24kHz
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const transcriptBufferRef = useRef<string>("");
  const onRecommendationRef = useRef(onRecommendation);
  onRecommendationRef.current = onRecommendation;

  // ── Reproducción de audio PCM base64 (24kHz) ─────────────────────────────
  const playBase64Pcm = useCallback((base64: string) => {
    if (!playAudioContextRef.current) return;
    const ctx = playAudioContextRef.current;

    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

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
    if (nextPlayTimeRef.current < currentTime) nextPlayTimeRef.current = currentTime;
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += buffer.duration;

    activeSourcesRef.current.push(source);
    setIsSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0) setIsSpeaking(false);
    };
  }, []);

  // ── Detener reproducción (interrupciones) ────────────────────────────────
  const stopAudioPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((s) => { try { s.stop(); } catch (_e) {} });
    activeSourcesRef.current = [];
    if (playAudioContextRef.current) {
      nextPlayTimeRef.current = playAudioContextRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  // ── Limpieza completa ────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => { try { s.close(); } catch (_e) {} });
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    stopAudioPlayback();
    if (playAudioContextRef.current) {
      playAudioContextRef.current.close().catch(() => {});
      playAudioContextRef.current = null;
    }
  }, [stopAudioPlayback]);

  // ── Finalizar sesión ─────────────────────────────────────────────────────
  const endSession = useCallback(() => {
    cleanup();
    setIsConnected(false);
    setIsConnecting(false);
  }, [cleanup]);

  // ── Iniciar sesión Live ──────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    transcriptBufferRef.current = "";

    try {
      // 1. Contexto de reproducción a 24kHz
      playAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayTimeRef.current = playAudioContextRef.current.currentTime;

      // 2. Configurar micrófono ANTES de conectar a Gemini
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = audioContextRef.current.createMediaStreamSource(stream);

      const workletCode = `
        class AudioRecorder extends AudioWorkletProcessor {
          process(inputs) {
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
      await audioContextRef.current.audioWorklet.addModule(URL.createObjectURL(blob));
      const recorderNode = new AudioWorkletNode(audioContextRef.current, "audio-recorder");

      // 3. Conectar a Gemini Live
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          systemInstruction: buildSystemInstruction(financialContext, intakeData),
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsConnected(true);

            // 4. Activar envío de audio al conectar
            recorderNode.port.onmessage = (e) => {
              const pcm16 = e.data;
              const buffer = new ArrayBuffer(pcm16.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcm16.length; i++) view.setInt16(i * 2, pcm16[i], true);
              let binary = "";
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);

              sessionPromise.then((session) => {
                try {
                  session.sendRealtimeInput({
                    audio: { data: window.btoa(binary), mimeType: "audio/pcm;rate=16000" },
                  });
                } catch (_e) {}
              });
            };

            source.connect(recorderNode);
            recorderNode.connect(audioContextRef.current!.destination);
          },

          onmessage: (message: LiveServerMessage) => {
            console.log("[Gemini] message:", JSON.stringify(message).slice(0, 200));

            // Setup completo — el servidor está listo
            if (message.setupComplete) {
              console.log("[Gemini] setup completo ✓");
            }

            // Manejar interrupciones
            if (message.serverContent?.interrupted) {
              stopAudioPlayback();
            }

            // Reproducir audio de respuesta
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                playBase64Pcm(part.inlineData.data);
              }
              // Detectar etiqueta PORTFOLIO en la transcripción de texto
              if (part.text) {
                transcriptBufferRef.current += part.text;
                const match = transcriptBufferRef.current.match(/PORTFOLIO:(\{[\s\S]*?\})/);
                if (match) {
                  try {
                    const rec: PortfolioRecommendation = JSON.parse(match[1]);
                    onRecommendationRef.current?.(rec);
                    transcriptBufferRef.current = "";
                  } catch { /* ignorar errores de parse */ }
                }
              }
            }
          },

          onerror: (err) => {
            console.error("Gemini Live error:", err);
            setError("Error de conexión. Intenta de nuevo.");
            cleanup();
            setIsConnected(false);
            setIsConnecting(false);
          },

          onclose: (event: any) => {
            console.warn("Sesión Gemini cerrada:", event?.code, event?.reason);
            cleanup();
            if (event?.code && event.code !== 1000) {
              setError(`Conexión cerrada (${event.code}): ${event.reason || "sin razón"}`);
            }
            setIsConnected(false);
            setIsConnecting(false);
          },
        },
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError("No se pudo conectar con la IA.");
      cleanup();
      setIsConnecting(false);
    }
  }, [voiceName, financialContext, intakeData, playBase64Pcm, stopAudioPlayback, cleanup]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  return { startSession, endSession, isConnected, isConnecting, isSpeaking, error };
}
