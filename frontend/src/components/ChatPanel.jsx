import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Volume2, VolumeX } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const ChatPanel = ({
  messages,
  onSend,
  onClear,
  model,
  onModelChange,
  ttsEnabled,
  onToggleTts,
  isProcessing,
  lang,
  onLangChange,
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isProcessing) return;
    onSend(text);
    setInput("");
  };

  return (
    <div
      className="h-full flex flex-col bg-white/[0.03] backdrop-blur-2xl border-l border-white/10 relative"
      data-testid="chat-panel"
    >
      {/* Header */}
      <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex flex-col">
          <span className="font-display text-lg font-medium tracking-tight">
            J.A.R.V.I.S
          </span>
          <span className="font-mono text-[10px] text-cyan-400/80 tracking-[0.25em] uppercase">
            Neural Interface
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="toggle-tts-btn"
            variant="ghost"
            size="icon"
            onClick={onToggleTts}
            className="text-white/70 hover:text-cyan-400 hover:bg-white/5"
            title={ttsEnabled ? "Mute voice" : "Enable voice"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            data-testid="clear-chat-btn"
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-white/70 hover:text-rose-400 hover:bg-white/5"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selectors */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger
            data-testid="model-select"
            className="h-9 bg-white/5 border-white/10 text-xs font-mono text-white hover:bg-white/10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0A0A14] border-white/10 text-white">
            <SelectItem value="gemini-2.5-flash" className="font-mono text-xs">
              gemini-2.5-flash
            </SelectItem>
            <SelectItem value="gemini-2.5-pro" className="font-mono text-xs">
              gemini-2.5-pro
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={lang} onValueChange={onLangChange}>
          <SelectTrigger
            data-testid="lang-select"
            className="h-9 w-28 bg-white/5 border-white/10 text-xs font-mono text-white hover:bg-white/10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0A0A14] border-white/10 text-white">
            <SelectItem value="es-ES" className="font-mono text-xs">ES</SelectItem>
            <SelectItem value="en-US" className="font-mono text-xs">EN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar"
        data-testid="chat-messages"
      >
        {messages.length === 0 && (
          <div className="text-white/40 text-sm font-mono leading-relaxed">
            <p className="text-cyan-400/80 mb-2 tracking-widest text-[10px] uppercase">
              [ system ready ]
            </p>
            <p>
              Diga <span className="text-cyan-400">"activate"</span> o{" "}
              <span className="text-cyan-400">"jarvis"</span> y luego su pregunta.
            </p>
            <p className="mt-2 text-white/30">
              También puede escribir directamente abajo.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%]"
                  : "self-start max-w-[92%]"
              }
              data-testid={`msg-${m.role}`}
            >
              {m.role === "user" ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tr-sm px-4 py-2.5 text-white text-sm border border-white/15 shadow-lg">
                  {m.content}
                </div>
              ) : (
                <div className="px-1 py-1">
                  <div className="text-[10px] font-mono text-cyan-400/70 tracking-[0.25em] mb-1">
                    JARVIS
                  </div>
                  <div className="text-cyan-100 text-sm leading-relaxed font-light tracking-wide whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="self-start flex items-center gap-2 text-cyan-400/80 text-xs font-mono tracking-widest"
            data-testid="processing-indicator"
          >
            <span className="block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            PROCESANDO...
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 pb-14 border-t border-white/10 shrink-0 bg-[#05050A]/60 backdrop-blur-md">
        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-400/40 transition">
          <textarea
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escriba un mensaje o diga 'activate'..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none outline-none font-sans py-1.5 max-h-24"
          />
          <Button
            data-testid="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="icon"
            className="h-8 w-8 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
