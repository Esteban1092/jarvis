import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Mic, MicOff, Power } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Sphere from "@/components/Sphere";
import ChatPanel from "@/components/ChatPanel";
import { useVoice } from "@/hooks/useVoice";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getOrCreateSession = () => {
  let s = localStorage.getItem("jarvis_session_id");
  if (!s) {
    s = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("jarvis_session_id", s);
  }
  return s;
};

export default function Jarvis() {
  const [sessionId] = useState(getOrCreateSession);
  const [messages, setMessages] = useState([]);
  const [model, setModel] = useState("gemini-2.5-flash");
  const [lang, setLang] = useState("es-ES");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // pendingCommandRef avoids racing duplicate sends
  const inflightRef = useRef(false);

  const handleCommand = async (text) => {
    if (!text || inflightRef.current) return;
    await sendMessage(text);
  };

  const handleTranscript = (_t, _awake) => {
    // could surface live transcript on screen — handled via voice.interim
  };

  const voice = useVoice({
    onCommand: handleCommand,
    onTranscript: handleTranscript,
    lang,
  });

  // Load initial history
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/chat/history/${sessionId}`);
        setMessages(res.data || []);
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.error("History load failed", e);
        }
      }
    })();
  }, [sessionId]);

  const sendMessage = async (text) => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setIsProcessing(true);

    // Optimistic user message
    const userMsg = {
      id: `tmp_${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: text,
        model,
      });
      const reply = res.data.reply;
      const assistantMsg = {
        id: `a_${Date.now()}`,
        session_id: sessionId,
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
        model: res.data.model,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.data.used_fallback_key) {
        toast("Using Emergent fallback key — your Gemini key was rejected.", {
          duration: 4000,
        });
      }

      if (ttsEnabled) {
        voice.speak(reply, { lang });
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      const detail = err?.response?.data?.detail || err.message;
      toast.error(`Jarvis falló: ${detail}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          session_id: sessionId,
          role: "assistant",
          content:
            lang.startsWith("es")
              ? "Lo siento Señor, no logré procesar la consulta."
              : "Apologies sir, I couldn't process the request.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsProcessing(false);
      inflightRef.current = false;
    }
  };

  const handleClear = async () => {
    try {
      await axios.delete(`${API}/chat/history/${sessionId}`);
      setMessages([]);
      toast.success("Memoria reiniciada");
    } catch (e) {
      toast.error("No se pudo limpiar el historial");
    }
  };

  const sphereState = useMemo(() => {
    if (voice.speaking) return "speaking";
    if (isProcessing) return "thinking";
    if (voice.awake) return "listening";
    if (voice.listening) return "waiting";
    return "idle";
  }, [voice.speaking, voice.awake, voice.listening, isProcessing]);

  const statusText = useMemo(() => {
    if (voice.speaking) return lang.startsWith("es") ? "HABLANDO" : "SPEAKING";
    if (isProcessing) return lang.startsWith("es") ? "RAZONANDO" : "THINKING";
    if (voice.awake) return lang.startsWith("es") ? "ESCUCHANDO" : "LISTENING";
    if (voice.listening)
      return lang.startsWith("es") ? "DIGA 'ACTIVATE'" : "SAY 'ACTIVATE'";
    return lang.startsWith("es") ? "EN REPOSO" : "STANDBY";
  }, [voice.speaking, voice.awake, voice.listening, isProcessing, lang]);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-12 h-screen w-full overflow-hidden bg-[#05050A] text-white"
      data-testid="jarvis-app"
    >
      {/* LEFT — Sphere */}
      <div className="col-span-1 md:col-span-8 relative flex items-center justify-center grain overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(0,40,80,0.4) 0%, rgba(5,5,10,1) 70%)",
          }}
        />
        {/* Faint grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,229,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.5) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Status pill */}
        <div
          className="absolute top-6 left-6 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md"
          data-testid="status-indicator"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              voice.listening || voice.awake
                ? "bg-cyan-400 animate-pulse"
                : "bg-white/40"
            }`}
          />
          <span className="text-[10px] font-mono text-cyan-300 tracking-[0.3em] uppercase">
            {statusText}
          </span>
        </div>

        {/* Mic toggle */}
        <div className="absolute top-6 right-6 flex gap-2">
          {voice.supported ? (
            <Button
              data-testid="mic-toggle-btn"
              onClick={voice.listening ? voice.stop : voice.start}
              variant="ghost"
              className={`gap-2 rounded-full px-4 py-2 border backdrop-blur-md font-mono text-[10px] tracking-widest uppercase ${
                voice.listening
                  ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {voice.listening ? (
                <>
                  <Mic className="w-3.5 h-3.5" /> mic on
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5" /> mic off
                </>
              )}
            </Button>
          ) : (
            <div className="text-[10px] font-mono text-rose-400 tracking-widest uppercase border border-rose-500/30 px-3 py-2 rounded-full bg-rose-500/10">
              Voz no soportada
            </div>
          )}
        </div>

        {/* Sphere */}
        <Sphere state={sphereState} />

        {/* Live transcript */}
        <AnimatePresence>
          {voice.interim && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-[60%] text-center"
              data-testid="live-transcript"
            >
              <div className="text-cyan-300/90 font-mono text-sm tracking-wide">
                "{voice.interim}"
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="text-[10px] font-mono text-white/40 tracking-[0.35em] uppercase">
            {voice.awake
              ? lang.startsWith("es")
                ? "PROCEDA — A LA ESCUCHA"
                : "PROCEED — LISTENING"
              : voice.listening
              ? lang.startsWith("es")
                ? 'DIGA "ACTIVATE" PARA INVOCAR'
                : 'SAY "ACTIVATE" TO INVOKE'
              : lang.startsWith("es")
              ? "ACTIVE EL MICRÓFONO"
              : "ENABLE THE MICROPHONE"}
          </div>
          <div className="font-display text-3xl md:text-5xl mt-3 font-light tracking-tighter">
            <span className="text-white">J.A.R.</span>
            <span className="text-cyan-400">V.I.S</span>
          </div>
        </div>

        {voice.error && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-rose-400/80 font-mono text-xs">
            {voice.error}
          </div>
        )}
      </div>

      {/* RIGHT — Chat */}
      <div className="col-span-1 md:col-span-4 h-full">
        <ChatPanel
          messages={messages}
          onSend={sendMessage}
          onClear={handleClear}
          model={model}
          onModelChange={setModel}
          ttsEnabled={ttsEnabled}
          onToggleTts={() => {
            if (ttsEnabled) voice.stopTTS();
            setTtsEnabled((v) => !v);
          }}
          isProcessing={isProcessing}
          lang={lang}
          onLangChange={setLang}
        />
      </div>
    </div>
  );
}
