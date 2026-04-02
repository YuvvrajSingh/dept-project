import React, { Fragment } from "react";
import type { TimetableMatrix, SlotData } from "@/lib/types";
import { SLOT_TIMES, DAY_SHORT } from "@/lib/types";

interface TimetableGridProps {
  matrix: TimetableMatrix | null;
  loading: boolean;
  filledSlots: number;
  onCellClick?: (day: number, slot: number, data: SlotData) => void;
  onDropEntry?: (sourceDay: number, sourceSlot: number, targetDay: number, targetSlot: number) => void;
}

export function TimetableGrid({ matrix, loading, filledSlots, onCellClick, onDropEntry }: TimetableGridProps) {
  const handleDragStart = (e: React.DragEvent, day: number, slot: number) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ day, slot }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetDay: number, targetSlot: number) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;
    
    try {
      const { day, slot } = JSON.parse(dataStr);
      if (day === targetDay && slot === targetSlot) return; // dropped on same slot
      onDropEntry?.(day, slot, targetDay, targetSlot);
    } catch {
      // ignore parse errors
    }
  };
  function renderSlotCell(data: SlotData, day: number, slot: number) {
    if (!data) {
      return (
      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, day, slot)}
        onClick={() => onCellClick?.(day, slot, null)}
        className="bg-surface-container-lowest m-0.5 p-3 rounded shadow-sm opacity-20 slot-cell cursor-pointer hover:bg-surface-container-high hover:opacity-100 transition-all border border-transparent hover:border-outline" 
      />
      );
    }
    if (data.type === "LAB_CONTINUATION") return null;

    if (data.type === "THEORY") {
      return (
      <div 
        draggable
        onDragStart={(e) => handleDragStart(e, day, slot)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, day, slot)}
        onClick={() => onCellClick?.(day, slot, data)}
        className="bg-surface-container-lowest m-0.5 p-3 rounded shadow-sm border-l-4 border-indigo-600 slot-cell cursor-pointer hover:bg-surface-container-high transition-colors"
      >
          <div className="text-[10px] font-bold text-indigo-600 mb-1">THEORY</div>
          <div className="text-sm font-bold text-on-surface leading-tight">{data.subjectCode}</div>
          <div className="mt-2 text-[10px] text-on-surface-variant">
            {data.teacherAbbr} // {data.roomName}
          </div>
        </div>
      );
    }

    if (data.type === "LAB") {
      return (
      <div 
        draggable
        onDragStart={(e) => handleDragStart(e, day, slot)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, day, slot)}
        onClick={() => onCellClick?.(day, slot, data)}
        className="lab-merged-cell m-0.5 p-3 rounded shadow-sm border-l-4 border-tertiary-container bg-surface-container-lowest cursor-pointer hover:bg-surface-container-high transition-colors"
      >
          <div className="text-[10px] font-bold text-on-tertiary-container mb-1 uppercase tracking-tighter">LAB SESSION</div>
          <div className="text-sm font-bold text-on-surface leading-tight">LABS</div>
          <div className="mt-3 space-y-1">
            {Object.entries(data.groups).map(([group, info]) => (
              <div key={group} className="text-[9px] bg-surface-container-low p-1 rounded font-bold">
                {group}: {info.teacher} @ {info.lab} 
                {info.subjectCode ? ` [${info.subjectCode}]` : ""}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-lg justify-end">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">Validated</span>
        </div>
        <div className="h-4 w-[1px] bg-outline-variant/30" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-on-surface">{filledSlots}/36</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">Slots Filled</span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-surface-container-highest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        {/* Day headers */}
        <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-surface-container-low border-b border-outline-variant/10">
          <div className="p-4" />
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <div key={d} className="p-4 text-center font-black text-xs uppercase tracking-widest text-on-surface">
              {DAY_SHORT[d]}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-on-surface-variant h-64 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl animate-spin text-secondary">progress_activity</span>
          </div>
        ) : (
          <div className="timetable-grid">
            {[1, 2, 3].map((slot) => (
              <Fragment key={`slotGroup-${slot}`}>
                {/* Slot label */}
                <div key={`label-${slot}`} className="flex flex-col justify-center items-center bg-surface-container-low border-r border-b border-outline-variant/10 p-2 slot-cell">
                  <span className="text-xs font-black text-on-surface">{SLOT_TIMES[slot].label}</span>
                  <span className="text-[9px] text-on-surface-variant font-medium">{SLOT_TIMES[slot].start} - {SLOT_TIMES[slot].end}</span>
                </div>
                {[1, 2, 3, 4, 5, 6].map((day) => {
                  const data = matrix?.timetable[String(day)]?.slots[String(slot)] ?? null;
                  return <div key={`${day}-${slot}`}>{renderSlotCell(data, day, slot)}</div>;
                })}
              </Fragment>
            ))}

            {/* Lunch break */}
            <div className="col-span-full h-10 flex items-center justify-center bg-surface-container-highest border-y border-outline-variant/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">
                Academic Break // Lunch (12:45 - 14:00)
              </span>
            </div>

            {[4, 5, 6].map((slot) => (
              <Fragment key={`slotGroup-${slot}`}>
                <div key={`label-${slot}`} className="flex flex-col justify-center items-center bg-surface-container-low border-r border-b border-outline-variant/10 p-2 slot-cell">
                  <span className="text-xs font-black text-on-surface">{SLOT_TIMES[slot].label}</span>
                  <span className="text-[9px] text-on-surface-variant font-medium">{SLOT_TIMES[slot].start} - {SLOT_TIMES[slot].end}</span>
                </div>
                {[1, 2, 3, 4, 5, 6].map((day) => {
                  const data = matrix?.timetable[String(day)]?.slots[String(slot)] ?? null;
                  if (data?.type === "LAB_CONTINUATION") {
                    return (
                      <div 
                        key={`${day}-${slot}`} 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, slot)}
                        className="slot-cell"
                      />
                    );
                  }
                  return <div key={`${day}-${slot}`}>{renderSlotCell(data, day, slot)}</div>;
                })}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
