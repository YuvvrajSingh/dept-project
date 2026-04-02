"use client";

import { motion } from "framer-motion";

export default function StatCard({ label, count, icon: Icon, onClick, index = 0, accentColor }) {
  const colors = [
    { bg: "bg-accent/8", border: "border-accent/30", accent: "bg-accent", text: "text-accent" },
    { bg: "bg-chart-3/8", border: "border-chart-3/30", accent: "bg-chart-3", text: "text-chart-3" },
    { bg: "bg-chart-4/8", border: "border-chart-4/30", accent: "bg-chart-4", text: "text-chart-4" },
    { bg: "bg-chart-2/8", border: "border-chart-2/30", accent: "bg-chart-2", text: "text-chart-2" },
    { bg: "bg-chart-5/8", border: "border-chart-5/30", accent: "bg-chart-5", text: "text-chart-5" },
  ];
  const c = colors[index % colors.length];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden group border-2 border-foreground/15 hover:border-foreground p-0 text-left bg-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,0.8)]`}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top accent strip */}
      <div className={`h-[3px] w-full ${c.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
      
      <div className="p-5 pt-4">
        {/* Icon + Module tag */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center`}>
            {Icon && <Icon size={18} strokeWidth={1.5} className={c.text} />}
          </div>
          <span className="text-[7px] font-mono tracking-[0.3em] text-muted-foreground/40 uppercase">
            ENT-{String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Count */}
        <motion.div 
          className="font-heading text-4xl font-extrabold tracking-tight leading-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.07, duration: 0.4 }}
        >
          {count}
        </motion.div>

        {/* Label */}
        <div className="text-[9px] font-mono tracking-[0.25em] text-muted-foreground mt-2 uppercase">
          {label}
        </div>
      </div>

      {/* Hover reveal: bottom bar grows */}
      <div className={`h-0.5 w-0 group-hover:w-full ${c.accent} transition-all duration-500 ease-out`} />
    </motion.button>
  );
}
