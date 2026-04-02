import React, { useState } from "react";
import { timetableApi } from "@/lib/api";
import type { SlotData } from "@/lib/types";

interface PreviewPanelProps {
  day: number;
  slot: number;
  data: SlotData;
  onEdit: () => void;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

export function PreviewPanel({ day, slot, data, onEdit, onClose, onDeleteSuccess }: PreviewPanelProps) {
  const [deleting, setDeleting] = useState(false);

  if (!data) return null;

  async function handleDelete() {
    if (!data) return;
    if (data.type === "LAB_CONTINUATION" || !("entryId" in data)) return;
    if (!data.entryId) return;
    if (!confirm("Are you sure you want to delete this scheduled entry?")) return;
    
    setDeleting(true);
    try {
      await timetableApi.deleteEntry(data.entryId);
      onDeleteSuccess();
    } catch (e: any) {
      alert(e.message || "Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden">
      <div className="bg-surface-container-highest p-5 border-b border-outline-variant/10 flex justify-between items-center">
        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-lg">visibility</span>
          Entry Preview
        </h3>
        <button onClick={onClose} className="hover:bg-outline-variant/20 p-1 rounded transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-[80px_1fr] gap-y-3 text-sm">
          <div className="font-bold text-outline uppercase tracking-wider text-[10px] self-center">Day</div>
          <div className="font-bold text-on-surface">{day}</div>
          
          <div className="font-bold text-outline uppercase tracking-wider text-[10px] self-center">Slot</div>
          <div className="font-bold text-on-surface">{slot}</div>

          <div className="font-bold text-outline uppercase tracking-wider text-[10px] self-center">Type</div>
          <div className="font-black text-primary tracking-widest">{data.type}</div>

          {data.type === "THEORY" && (
            <>
              <div className="font-bold text-outline uppercase tracking-wider text-[10px] self-center">Subject</div>
              <div className="font-bold text-on-surface">{data.subjectCode} - {data.subjectName}</div>

              <div className="font-bold text-outline uppercase tracking-wider text-[10px] self-center">Teacher</div>
              <div className="font-bold text-on-surface">{data.teacherAbbr}</div>

              <div className="font-bold text-outline uppercase tracking-wider text-[10px] self-center">Room</div>
              <div className="font-bold text-on-surface">{data.roomName}</div>
            </>
          )}

          {data.type === "LAB" && (
            <>
              <div className="font-bold text-outline uppercase tracking-wider text-[10px] self-start pt-1">Groups</div>
              <div className="space-y-2">
                {Object.entries(data.groups).map(([g, info]) => (
                  <div key={g} className="bg-surface-container-low p-2 rounded border border-outline-variant/20">
                    <span className="font-black text-indigo-700 text-[10px] block mb-1">{g}</span>
                    <span className="font-bold text-on-surface text-xs block">{info.subjectCode}</span>
                    <span className="text-on-surface-variant text-[10px] flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[10px]">person</span> {info.teacher}
                      <span className="material-symbols-outlined text-[10px] ml-2">meeting_room</span> {info.lab}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="pt-4 flex gap-3 border-t border-outline-variant/10 mt-6">
          <button 
            onClick={onEdit} 
            className="flex-1 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm hover:opacity-90 transition-opacity"
          >
            Edit
          </button>
          <button 
            disabled={deleting}
            onClick={handleDelete} 
            className="flex-1 py-2.5 bg-destructive/10 text-destructive border border-destructive/20 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
