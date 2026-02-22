"use client";

import { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyButton({
  text,
  label = "Copy",
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
    <motion.button
      type="button"
      onClick={handleCopy}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-[color:var(--text-body)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-strong)] ${className}`}
      style={{ background: "var(--surface-strong)", borderColor: "var(--border)" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === "idle" ? (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="inline-flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {label}
          </motion.span>
        ) : null}

        {status === "copied" ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="inline-flex items-center gap-2 text-[color:var(--accent)]"
          >
            <Check className="h-4 w-4" />
            Copied
          </motion.span>
        ) : null}

        {status === "error" ? (
          <motion.span
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="inline-flex items-center gap-2 text-red-500"
          >
            <X className="h-4 w-4" />
            Blocked
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
