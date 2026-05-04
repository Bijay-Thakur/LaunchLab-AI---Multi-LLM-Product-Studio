"use client";

import { motion } from "framer-motion";

export default function PulsingOrb({ size = 64 }: { size?: number }) {
  const inner = Math.round(size * 0.55);
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-violet to-accent-blue opacity-40 blur-md"
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute rounded-full bg-gradient-to-br from-accent-violet to-accent-blue"
        style={{ width: inner, height: inner }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute rounded-full bg-white/85"
        style={{ width: inner * 0.35, height: inner * 0.35 }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
