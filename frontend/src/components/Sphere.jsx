import { motion, AnimatePresence } from "framer-motion";

/**
 * Jarvis Sphere — white-blue orb with audio-reactive cyan aura.
 * State: "idle" | "waiting" | "listening" | "speaking" | "thinking"
 */
export const Sphere = ({ state = "idle" }) => {
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isThinking = state === "thinking";
  const isWaiting = state === "waiting";

  // Sphere pulse
  const sphereAnim =
    isSpeaking
      ? { scale: [1, 1.06, 1.02, 1.07, 1] }
      : isListening
      ? { scale: [1, 1.04, 1] }
      : isThinking
      ? { scale: [1, 1.015, 1] }
      : { scale: [1, 1.02, 1] };

  const sphereTransition =
    isSpeaking
      ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
      : isListening
      ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
      : isThinking
      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
      : { duration: 4, repeat: Infinity, ease: "easeInOut" };

  return (
    <div
      className="relative flex items-center justify-center w-72 h-72 md:w-96 md:h-96"
      data-testid="jarvis-sphere"
      data-state={state}
    >
      {/* Outer ripple auras (only visible when speaking/listening) */}
      <AnimatePresence>
        {(isSpeaking || isListening) && (
          <>
            {[0, 0.4, 0.8].map((delay, i) => (
              <motion.div
                key={`ripple-${i}`}
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(0,229,255,0.35) 0%, rgba(0,122,255,0.15) 50%, transparent 70%)",
                  filter: "blur(18px)",
                }}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: isSpeaking ? 1.6 : 2.4,
                  repeat: Infinity,
                  delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Subtle ambient halo */}
      <motion.div
        className="absolute -inset-12 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,229,255,0.18) 0%, rgba(0,122,255,0.08) 40%, transparent 70%)",
          filter: "blur(28px)",
        }}
        animate={{
          opacity: isSpeaking ? [0.7, 1, 0.7] : isListening ? [0.5, 0.85, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Slow rotating ring */}
      <motion.div
        className="absolute -inset-6 rounded-full border"
        style={{ borderColor: "rgba(0,229,255,0.25)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -inset-2 rounded-full border"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner cyan glow layer */}
      <motion.div
        className="absolute inset-2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(224,242,254,0.85) 25%, rgba(0,229,255,0.6) 55%, rgba(0,122,255,0.7) 100%)",
          filter: isSpeaking ? "blur(2px)" : "blur(1px)",
        }}
        animate={sphereAnim}
        transition={sphereTransition}
      />

      {/* Glass core */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: "78%",
          height: "78%",
          background:
            "radial-gradient(circle at 30% 25%, #ffffff 0%, #E0F2FE 35%, #7DD3FC 65%, #0284C7 100%)",
          boxShadow:
            "inset -25px -35px 60px rgba(2,132,199,0.55), inset 15px 20px 40px rgba(255,255,255,0.9), 0 0 60px rgba(0,229,255,0.5), 0 0 120px rgba(0,122,255,0.35)",
        }}
        animate={sphereAnim}
        transition={sphereTransition}
      >
        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: "10%",
            left: "18%",
            width: "30%",
            height: "22%",
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)",
            filter: "blur(2px)",
          }}
        />
        {/* Bottom rim glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 100%, rgba(0,229,255,0.55) 0%, transparent 35%)",
            mixBlendMode: "screen",
          }}
        />
      </motion.div>

      {/* Equator line when listening (Siri-like waveform feel) */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="absolute left-0 right-0 top-1/2 mx-auto rounded-full"
            style={{
              height: "2px",
              background:
                "linear-gradient(90deg, transparent 0%, #00E5FF 50%, transparent 100%)",
              filter: "blur(1px)",
            }}
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: [0.3, 1, 0.3], scaleX: [0.5, 1, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* Waiting indicator dots */}
      <AnimatePresence>
        {isWaiting && (
          <motion.div
            className="absolute -bottom-16 flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block w-2 h-2 rounded-full bg-cyan-400"
                animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sphere;
