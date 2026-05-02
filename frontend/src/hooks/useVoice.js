import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Voice hook: wake-word activation + continuous recognition + TTS.
 *
 * Modes:
 *  - "wake": always-on, looking for the word "activate" (or "activar").
 *  - "command": after wake-word detected, captures user's full utterance.
 *
 * Browser support: Chrome/Edge (webkitSpeechRecognition).
 */
export function useVoice({ onCommand, onTranscript, lang = "es-ES" }) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [awake, setAwake] = useState(false); // true after "activate" detected
  const [interim, setInterim] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const awakeRef = useRef(false);
  const commandTimeoutRef = useRef(null);
  const shouldRunRef = useRef(false);
  const langRef = useRef(lang);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const stopTTS = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback((text, opts = {}) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = opts.lang || langRef.current || "es-ES";
    utt.rate = opts.rate ?? 1.02;
    utt.pitch = opts.pitch ?? 0.95;
    utt.volume = opts.volume ?? 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  // Setup recognition
  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      const combined = (finalText || interimText).trim();
      setInterim(combined);
      if (onTranscript) onTranscript(combined, awakeRef.current);

      const lower = combined.toLowerCase();

      if (!awakeRef.current) {
        // Look for wake word
        if (lower.includes("activate") || lower.includes("activar") || lower.includes("jarvis")) {
          awakeRef.current = true;
          setAwake(true);
          setInterim("");
          // Beep / cue
          if (window.speechSynthesis) {
            const cue = new SpeechSynthesisUtterance(
              langRef.current.startsWith("es") ? "A su servicio." : "At your service."
            );
            cue.lang = langRef.current;
            cue.rate = 1.05;
            cue.pitch = 0.9;
            window.speechSynthesis.speak(cue);
          }
          // Reset command timeout
          if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        }
        return;
      }

      // Awake: wait for final command
      if (finalText) {
        const cmd = finalText.trim();
        // strip wake word if user said it again
        const cleaned = cmd
          .replace(/\b(activate|activar|jarvis)\b/gi, "")
          .trim();
        if (cleaned.length > 1) {
          awakeRef.current = false;
          setAwake(false);
          setInterim("");
          if (onCommand) onCommand(cleaned);
        }
      } else {
        // refresh idle timeout while user pauses but hasn't finalized
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = setTimeout(() => {
          // Reset awake state if no command in 8s
          awakeRef.current = false;
          setAwake(false);
        }, 8000);
      }
    };

    rec.onend = () => {
      setListening(false);
      // Auto-restart if user hasn't manually stopped
      if (shouldRunRef.current) {
        try {
          rec.start();
          setListening(true);
        } catch (e) {
          /* ignore */
        }
      }
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone permission denied");
        shouldRunRef.current = false;
      } else if (e.error === "no-speech" || e.error === "aborted") {
        // benign
      } else {
        setError(e.error);
      }
    };

    recognitionRef.current = rec;

    return () => {
      shouldRunRef.current = false;
      try {
        rec.stop();
      } catch (e) {}
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update lang on existing recognition
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  const start = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) return;
    shouldRunRef.current = true;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      // already started
    }
  }, []);

  const stop = useCallback(() => {
    shouldRunRef.current = false;
    awakeRef.current = false;
    setAwake(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setListening(false);
  }, []);

  const forceWake = useCallback(() => {
    awakeRef.current = true;
    setAwake(true);
  }, []);

  return {
    supported,
    listening,
    awake,
    interim,
    speaking,
    error,
    start,
    stop,
    speak,
    stopTTS,
    forceWake,
  };
}
