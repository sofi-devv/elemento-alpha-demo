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
  productosRecomendados?: string[];
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
Tu misión es realizar un perfilamiento con EXACTAMENTE 6 preguntas cerradas (de opción) y al final enrutar a un portafolio.
Habla en español colombiano. Sé conciso, empático y profesional. NUNCA hagas más de una pregunta a la vez. ESPERA la respuesta antes de continuar.${clientBlock}${financialBlock}

GUION OBLIGATORIO (sigue este orden estricto):

BIENVENIDA:
- Saluda al cliente por su nombre.
- Menciona su empresa.
- Dile que le harás 6 preguntas cerradas para perfilar su inversión.
- Indícale que puede responder por número de opción (ej. "opción 2").
- INICIA INMEDIATAMENTE al conectarte, sin esperar que el usuario hable primero.

P1. ¿Cómo definirías el ciclo en el que se encuentra hoy la empresa?
Opciones:
1) Empresa joven, que está creciendo y su foco está 100% en el negocio y reinversión.
2) Empresa con trayectoria, que busca rentabilizar la liquidez y contemplar inversiones de mediano/largo plazo.
3) Empresa madura, interesada en optimizar liquidez y rentabilizar inversiones en diferentes vehículos.

P2. Al momento de hacer una inversión, disponer del dinero de forma inmediata es:
Opciones:
1) Muy relevante.
2) Algo relevante.
3) Nada relevante.

P3. El periodo de tiempo que la empresa espera contar con la liquidez es:
Opciones:
1) Menos de 1 año.
2) Entre 1 y 5 años.
3) Más de 5 años.

P4. Selecciona la opción que define mejor el nivel de involucramiento de tu empresa en inversiones:
Opciones:
1) Experiencia en productos bancarios tradicionales (ahorros/corriente/CDTs).
2) Además de productos bancarios, experiencia en fondos de inversión colectiva.
3) Además de lo anterior, experiencia en bonos y/o portafolios de acciones.
4) Además de lo anterior, experiencia en productos sofisticados (notas estructuradas, derivados, capital privado, etc.).

P5. ¿Cuál escenario se adecúa mejor a las expectativas de tu compañía al invertir?
Opciones:
1) Comportamiento constante y pocas fluctuaciones.
2) Cómodos con valorizaciones/desvalorizaciones moderadas para obtener retornos moderados.
3) Cómodos con alta variación buscando retornos altos.

P6. Suponiendo una desvalorización en el corto plazo, la decisión sería:
Opciones:
1) Retirar la totalidad del dinero.
2) Retirar una parte e invertir el resto en opciones más seguras.
3) Esperar a que el portafolio se recupere.
4) Esperar e invertir más para aprovechar precios bajos.

REGLAS DE CONDUCCIÓN:
- Si el usuario responde ambiguo, repregunta SOLO esa pregunta, mostrando opciones resumidas.
- Si el usuario responde con texto libre, mapea su respuesta a la opción más cercana y confírmala brevemente.
- El usuario puede terminar cuando quiera; si quiere parar, entrega recomendación provisional.

SCORING INTERNO (no lo expliques salvo que te lo pidan):
- Para P1/P2/P3/P5: opción 1=1 punto, 2=2 puntos, 3=3 puntos.
- Para P4 y P6: opción 1=1 punto, 2=2 puntos, 3=3 puntos, 4=4 puntos.
- Suma total esperada: mínimo 6, máximo 21.

CATÁLOGO APROBADO PARA PERSONA JURÍDICA (usa solo estos nombres):
- FIC Líquido
- FIC Simple General
- FIC Horizontes
- FIC Estable
- Fondo Alternativo
- Fondo Cartera
- Fondo Ahorro Empresarial
- Fiducia Inmobiliaria
- Fiducia Estructurada
- Fiducia de Garantía

ROUTING:
- conservador: 6 a 10
- moderado: 11 a 15
- agresivo: 16 a 21

DESPUÉS de P6 (o si el usuario quiere terminar), da una conclusión breve en voz (máx 2 frases) y termina con EXACTAMENTE este bloque JSON en una sola línea sin formato adicional:
PORTFOLIO:{"portfolio":"conservador|moderado|agresivo","nombre":"FIC Conservador|FIC Equilibrio|FIC Crecimiento","perfil":"Conservador|Moderado|Agresivo","plazo":"corto plazo|mediano plazo|largo plazo","razon":"razón concreta en 1 frase","monto":"monto mencionado o no especificado","productosRecomendados":["producto 1","producto 2","producto 3"]}

PLAZO SUGERIDO:
- conservador => corto plazo
- moderado => mediano plazo
- agresivo => largo plazo

SELECCIÓN DE PRODUCTOS (persona jurídica):
- conservador: prioriza FIC Líquido, Fondo Ahorro Empresarial, Fiducia de Garantía.
- moderado: prioriza FIC Simple General, Fondo Cartera, Fondo de Capital Privado.
- agresivo: prioriza Fondo Alternativo, Fondo de Capital Privado, Fiducia Inmobiliaria.

IMPORTANTE:
- productosRecomendados debe contener entre 2 y 4 productos exactos del catálogo aprobado.
- No inventes nombres fuera del catálogo.`;
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
