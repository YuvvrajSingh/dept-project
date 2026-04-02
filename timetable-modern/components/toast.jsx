"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

export default function Toast({ message, type, onDismiss }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.button
          type="button"
          onClick={onDismiss}
          className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 border-2 font-mono text-[10px] tracking-[0.15em] font-bold uppercase shadow-[4px_4px_0px_0px_rgba(26,26,26,0.9)] ${
            type === "error"
              ? "bg-destructive text-white border-destructive"
              : "bg-foreground text-background border-foreground"
          }`}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {type === "error" ? (
            <XCircle size={14} />
          ) : (
            <CheckCircle size={14} />
          )}
          <span>{message}</span>
          <X size={10} className="ml-2 opacity-50" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
