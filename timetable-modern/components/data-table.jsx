"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import Spinner from "./spinner";

export default function DataTable({ columns, rows, onEdit, onDelete, loading }) {
  const [confirmingId, setConfirmingId] = useState(null);

  if (loading) {
    return <Spinner />;
  }

  if (!rows.length) {
    return (
      <div className="border border-foreground/15 border-dashed p-16 text-center">
        <div className="inline-block border-2 border-foreground/10 px-6 py-3 mb-2">
          <span className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/40 uppercase">
            ◼ NO DATA FOUND ◼
          </span>
        </div>
        <p className="text-[9px] font-mono tracking-[0.2em] text-muted-foreground/25 uppercase mt-2">
          ADD ENTRIES TO POPULATE THIS TABLE
        </p>
      </div>
    );
  }

  return (
    <div className="border border-foreground/15 overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-foreground/10 bg-muted/30">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-[9px] font-mono tracking-[0.2em] uppercase font-bold text-muted-foreground h-10 px-4 text-left"
              >
                {column.label}
              </th>
            ))}
            <th className="text-[9px] font-mono tracking-[0.2em] uppercase font-bold text-muted-foreground h-10 px-4 text-left w-[200px]">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <motion.tr
              key={row.id}
              className="border-b border-foreground/5 hover:bg-accent/5 transition-colors group data-cell"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.025, duration: 0.25 }}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-xs font-mono text-foreground/80">
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
              <td className="px-4 py-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="flex items-center gap-1.5 border border-foreground/15 px-3 py-1.5 text-[9px] font-mono tracking-[0.1em] font-bold hover:bg-accent hover:border-accent transition-all uppercase opacity-60 group-hover:opacity-100"
                  >
                    <Pencil size={9} />
                    EDIT
                  </button>
                  {confirmingId === row.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="border border-foreground/15 px-2 py-1.5 text-[9px] font-mono tracking-[0.1em] font-bold hover:bg-muted transition-all uppercase"
                      >
                        NO
                      </button>
                      <button
                        type="button"
                        onClick={() => { setConfirmingId(null); onDelete(row); }}
                        className="border border-destructive bg-destructive text-white px-2 py-1.5 text-[9px] font-mono tracking-[0.1em] font-bold hover:bg-destructive/80 transition-all uppercase"
                      >
                        CONFIRM
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(row.id)}
                      className="flex items-center gap-1.5 border border-destructive/20 text-destructive/60 px-3 py-1.5 text-[9px] font-mono tracking-[0.1em] font-bold hover:bg-destructive hover:text-white hover:border-destructive transition-all uppercase opacity-60 group-hover:opacity-100"
                    >
                      <Trash2 size={9} />
                      DEL
                    </button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
