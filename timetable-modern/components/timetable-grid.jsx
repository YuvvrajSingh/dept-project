"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

const DAYS = ["1", "2", "3", "4", "5", "6"];
const SLOTS = ["1", "2", "3", "4", "5", "6"];
const DAY_NAMES = { "1": "MON", "2": "TUE", "3": "WED", "4": "THU", "5": "FRI", "6": "SAT" };

export default function TimetableGrid({ matrix, onCellClick, readOnly, loading }) {
  if (loading) {
    return (
      <div className="border border-foreground/10 border-dashed p-16 text-center">
        <div className="inline-block border border-foreground/10 px-6 py-3">
          <span className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/40 uppercase">
            ◼ LOADING MATRIX ◼
          </span>
        </div>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="border border-foreground/10 border-dashed p-16 text-center">
        <div className="inline-block border border-foreground/10 px-6 py-3">
          <span className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/40 uppercase">
            ◼ SELECT A CLASS AND CLICK LOAD ◼
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="border border-foreground/15 overflow-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="grid min-w-[780px]"
        style={{ gridTemplateColumns: `72px repeat(6, minmax(110px, 1fr))` }}
      >
        {/* Corner cell */}
        <div className="border-b border-r border-foreground/15 bg-foreground text-background p-2 text-[8px] font-mono tracking-[0.2em] uppercase font-bold flex items-center justify-center">
          <span className="opacity-50">SLOT</span>
        </div>

        {/* Day headers */}
        {DAYS.map((day) => (
          <div
            key={day}
            className="border-b border-r border-foreground/15 bg-foreground text-background p-2 text-[9px] font-mono tracking-[0.2em] uppercase font-bold flex flex-col items-center justify-center gap-0.5"
          >
            <span>{DAY_NAMES[day]}</span>
            <span className="text-[7px] opacity-30">DAY_{day}</span>
          </div>
        ))}

        {/* Slot rows */}
        {SLOTS.map((slot, si) => (
          <Fragment key={`row-${slot}`}>
            {/* Slot header */}
            <div className="border-b border-r border-foreground/10 p-2 text-center bg-muted/20 flex flex-col items-center justify-center gap-0.5">
              <span className="text-[10px] font-mono tracking-[0.15em] uppercase font-bold text-foreground/60">
                {slot}
              </span>
              <span className="text-[7px] font-mono tracking-[0.1em] text-muted-foreground/30 uppercase">
                PERIOD
              </span>
            </div>

            {/* Day cells */}
            {DAYS.map((day) => {
              const cell = matrix?.[day]?.slots?.[slot] ?? null;
              const key = `${day}-${slot}`;

              if (!cell) {
                return (
                  <button
                    key={key}
                    type="button"
                    className="border-b border-r border-foreground/5 p-1 min-h-[80px] flex items-center justify-center transition-all duration-200 disabled:cursor-default hover:bg-accent/8 group"
                    disabled={readOnly}
                    onClick={() => !readOnly && onCellClick(day, slot, null)}
                  >
                    {!readOnly && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={10} className="text-muted-foreground/40" />
                        <span className="text-[8px] font-mono tracking-[0.15em] text-muted-foreground/30 uppercase">ADD</span>
                      </div>
                    )}
                  </button>
                );
              }

              if (cell.type === "LAB") {
                const groupEntries = Object.entries(cell.groups || {}).sort(([a], [b]) => a.localeCompare(b));
                const groupValues = groupEntries.map(([, value]) => value);
                const subjectSummary = [...new Set(groupValues.map((g) => g.subjectCode))].join(" / ");

                return (
                  <button
                    key={key}
                    type="button"
                    className="border-b border-r border-foreground/5 p-2 min-h-[80px] bg-chart-2/5 border-l-[3px] border-l-chart-2/60 hover:bg-chart-2/10 transition-all text-left disabled:hover:bg-chart-2/5 group"
                    disabled={readOnly}
                    onClick={() => !readOnly && onCellClick(day, slot, cell)}
                  >
                    <div className="text-[8px] font-mono tracking-[0.15em] text-chart-2/40 uppercase mb-1">LAB</div>
                    <div className="text-[10px] font-mono font-bold tracking-[0.1em] uppercase text-foreground/80">
                      {subjectSummary || "LAB"}
                    </div>
                    <div className="text-[8px] font-mono text-muted-foreground/40 mt-1 uppercase">
                      {groupEntries.map(([gn]) => gn).join(" | ")}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  className="border-b border-r border-foreground/5 p-2 min-h-[80px] bg-chart-3/5 border-l-[3px] border-l-chart-3/60 hover:bg-chart-3/10 transition-all text-left disabled:hover:bg-chart-3/5 group"
                  disabled={readOnly}
                  onClick={() => !readOnly && onCellClick(day, slot, cell)}
                >
                  <div className="text-[8px] font-mono tracking-[0.15em] text-chart-3/40 uppercase mb-1">THEORY</div>
                  <div className="text-[10px] font-mono font-bold tracking-[0.1em] uppercase text-foreground/80">
                    {cell.subjectCode}
                  </div>
                  <div className="text-[8px] font-mono text-muted-foreground/40 mt-1">
                    {cell.teacherAbbr && <span>{cell.teacherAbbr}</span>}
                    {cell.roomName && <span className="ml-1 text-muted-foreground/25">/ {cell.roomName}</span>}
                  </div>
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </motion.div>
  );
}
