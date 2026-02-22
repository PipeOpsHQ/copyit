"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyButton({
  text,
  label = "COPY",
  className = "",
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    } finally {
      window.setTimeout(() => setStatus("idle"), 1400);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`font-mono text-sm font-bold uppercase transition-colors px-3 py-1 border-2 border-transparent hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-black ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === "idle" ? (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-block"
          >
            [ {label} ]
          </motion.span>
        ) : null}

        {status === "copied" ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-block text-[color:var(--accent)] group-hover:text-black"
          >
            [ DONE ]
          </motion.span>
        ) : null}

        {status === "error" ? (
          <motion.span
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-block text-red-500"
          >
            [ ERR! ]
          </motion.span>
        ) : null}
      </AnimatePresence>
    </button>
  );
}
