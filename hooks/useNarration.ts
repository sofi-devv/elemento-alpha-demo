"use client";

/**
 * Narración solo audio — COPIA EXACTA de useVoiceAgent pero:
 * - El texto va en systemInstruction con "INICIA INMEDIATAMENTE"
 * - Requiere permiso de micrófono (igual que onboarding) pero el usuario no habla
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
});

function buildNarrationInstruction(textToSpeak: string): string {
  return `Eres un narrador profesional de Elemento Alpha.
Tu ÚNICA tarea es leer en voz alta el siguiente texto en español colombiano, de forma clara, natural y profesional.

INSTRUCCIONES ESTRICTAS:
- INICIA INMEDIATAMENTE al conectarte, sin esperar que el usuario hable primero.
- NO añadas saludos, comentarios, preguntas ni nada extra.
- Solo lee el texto proporcionado, palabra por palabra.
- Cuando termines de leer, guarda silencio.

TEXTO A LEER:
"""
${textToSpeak}
"""

Comienza a leer AHORA.`;
}

export interface UseNarrationOptions {
  voiceName?: string;
}

export function useNarration(options: UseNarrationOptions = {}) {
  const { voiceName = "Zephyr" } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Refs de recursos (IGUAL que useVoiceAgent) ────────────────────────────
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);      // captura 16kHz
  const playAudioContextRef = useRef<AudioContext | null>(null);  // reproducción 24kHz
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const settledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reproducción de audio PCM base64 (24kHz) — COPIA EXACTA de useVoiceAgent ─
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

  const stopAudioPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((s) => {
      try { s.stop(); } catch { /* ya terminado */ }
    });
    activeSourcesRef.current = [];
    if (playAudioContextRef.current) {
      nextPlayTimeRef.current = playAudioContextRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  // ── Limpieza completa (IGUAL que useVoiceAgent) ───────────────────────────
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then?.((s: any) => { try { s.close(); } catch { /* ignorar */ } });
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

  const speak = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text?.trim();
      if (!trimmed) return;

      cleanup();
      settledRef.current = false;
      setError(null);
      setIsLoading(true);

      let resolveEnded!: () => void;
      let rejectEnded!: (e: Error) => void;
      const endedPromise = new Promise<void>((res, rej) => {
        resolveEnded = res;
        rejectEnded = rej;
      });

      const settleOk = () => {
        if (settledRef.current) return;
        settledRef.current = true;
        cleanup();
        setIsLoading(false);
        setIsSpeaking(false);
        resolveEnded();
      };

      const settleErr = (msg: string) => {
        if (settledRef.current) return;
        settledRef.current = true;
        cleanup();
        setIsLoading(false);
        setIsSpeaking(false);
        setError(msg);
        rejectEnded(new Error(msg));
      };

      // Timeout global
      timeoutRef.current = setTimeout(() => {
        settleErr("Tiempo agotado esperando respuesta de Gemini Live.");
      }, 60_000);

      try {
        // 1. Contexto de reproducción a 24kHz (igual que useVoiceAgent)
        playAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
        nextPlayTimeRef.current = playAudioContextRef.current.currentTime;

        // 2. Configurar micrófono IGUAL que useVoiceAgent
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

        let sawTurnComplete = false;
        let receivedAnyAudio = false;

        const drainPlayback = () => {
          let ticks = 0;
          const maxTicks = 9000;
          const tick = () => {
            ticks++;
            if (activeSourcesRef.current.length === 0) {
              settleOk();
              return;
            }
            if (ticks > maxTicks) {
              settleErr("Tiempo de espera agotado reproduciendo audio.");
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        };

        // 3. Conectar a Gemini Live (IGUAL que useVoiceAgent)
        const sessionPromise = ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
            systemInstruction: buildNarrationInstruction(trimmed),
          },
          callbacks: {
            onopen: () => {
              console.log("[useNarration] Conectado ✓");
              setIsLoading(false);

              // 4. Activar envío de audio al conectar (IGUAL que useVoiceAgent)
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
                  } catch { /* sesión cerrada */ }
                });
              };

              source.connect(recorderNode);
              recorderNode.connect(audioContextRef.current!.destination);
            },

            onmessage: (message: LiveServerMessage) => {
              console.log("[useNarration] message:", JSON.stringify(message).slice(0, 200));

              if (message.setupComplete) {
                console.log("[useNarration] setup completo ✓");
              }

              if (message.serverContent?.interrupted) {
                stopAudioPlayback();
              }

              const parts = message.serverContent?.modelTurn?.parts || [];
              for (const part of parts) {
                if (part.inlineData?.data) {
                  receivedAnyAudio = true;
                  playBase64Pcm(part.inlineData.data);
                }
              }

              if (message.serverContent?.turnComplete) {
                console.log("[useNarration] turnComplete, receivedAudio:", receivedAnyAudio);
                sawTurnComplete = true;
                drainPlayback();
              }
            },

            onerror: (err: ErrorEvent) => {
              console.error("[useNarration] error:", err);
              settleErr(err.message || "Error en Gemini Live.");
            },

            onclose: (event: CloseEvent) => {
              console.warn("[useNarration] cerrado:", event?.code, event?.reason);
              if (settledRef.current) return;

              if (sawTurnComplete || receivedAnyAudio) {
                drainPlayback();
                return;
              }

              const reason =
                event?.reason?.trim() ||
                (event?.code === 1000
                  ? "Sesión cerrada sin audio. Revisa el modelo y permisos de Gemini Live."
                  : `Conexión cerrada (${event?.code}).`);
              settleErr(reason);
            },
          },
        });

        sessionRef.current = sessionPromise;
        await endedPromise;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "No se pudo generar la narración.";
        if (!settledRef.current) settleErr(msg);
      }
    },
    [cleanup, playBase64Pcm, stopAudioPlayback, voiceName]
  );

  const stop = useCallback(() => {
    settledRef.current = true;
    cleanup();
    setIsLoading(false);
    setIsSpeaking(false);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { speak, stop, isSpeaking, isLoading, error };
}
