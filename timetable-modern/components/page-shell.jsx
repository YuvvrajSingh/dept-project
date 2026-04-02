"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

export default function PageShell({ title, subtitle, actions, children }) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* Animated title with decorative elements */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-2 h-8 bg-accent"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, ease }}
              style={{ transformOrigin: "top" }}
            />
            <div>
              <motion.h1
                className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight uppercase leading-none"
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease }}
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p
                  className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.2em] mt-1.5 uppercase flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <ChevronRight size={8} className="text-accent" />
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>

          {/* Accent bar */}
          <motion.div
            className="h-px bg-gradient-to-r from-accent via-accent/40 to-transparent mt-4 ml-5"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease }}
            style={{ transformOrigin: "left" }}
          />
        </div>

        {actions && (
          <motion.div
            className="flex items-center gap-2 shrink-0"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {actions}
          </motion.div>
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
