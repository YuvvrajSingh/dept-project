"use client";

import { useEffect, useState, Fragment, useMemo } from "react";
import { teacherMeApi, timetableApi } from "@/lib/api";
import type { Teacher, TimetableEntry } from "@/lib/types";
import { DAY_LABELS, DAY_SHORT, SLOT_TIMES } from "@/lib/types";

const getClassLabel = (e: any) => {
  if (e.classSection?.branch?.name) {
    return `${e.classSection.branch.name}-${e.classSection.semester}`;
  }
  return "Unknown Class";
};

const getUniqueSubjects = (cellEntries: any[]) => {
  const unique = new Map<string, any>();
  for (const e of cellEntries) {
    const key = `${e.subject?.id ?? e.subject?.code}-${e.entryType}`;
    if (!unique.has(key)) {
      unique.set(key, { 
        ...e, 
        batches: 1, 
        groupNames: e.groupName ? new Set([e.groupName]) : new Set(),
        classes: new Set([getClassLabel(e)]) 
      });
    } else {
      const u = unique.get(key);
      u.batches += 1;
      if (e.groupName) u.groupNames.add(e.groupName);
      u.classes.add(getClassLabel(e));
    }
  }
  return Array.from(unique.values());
};

function CellCard({ u, onCancel, onRestore }: { u: any; onCancel: (u: any) => void; onRestore: (u: any) => void }) {
  const isLab = u.entryType === "LAB";
  const isCancelled = u.isCancelled;

  const wrapperClasses = isCancelled
    ? "border-l-[4px] border-l-outline-variant bg-surface-container-lowest border border-outline-variant/30 shadow-sm opacity-60 grayscale"
    : isLab 
      ? "border-l-[4px] border-l-tertiary-container bg-surface-container-lowest border border-outline-variant/10 shadow-sm"
      : "border-l-[4px] border-l-indigo-600 bg-surface-container-lowest border border-outline-variant/10 shadow-sm";
  const badgeClasses = isCancelled
    ? "bg-outline-variant/20 text-on-surface-variant"
    : isLab
      ? "bg-tertiary-container/30 text-on-tertiary-container"
      : "bg-indigo-600/20 text-indigo-700";

  return (
    <div className={`flex flex-col flex-1 p-2 rounded ${wrapperClasses}`}>
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded ${badgeClasses}`}>
            {isLab ? "LAB SESSION" : "THEORY"}
          </span>
          {u.groupNames?.size > 0 ? (
            <span className="text-[9px] font-bold bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded shadow-sm border border-outline-variant/10">
              Groups: {Array.from(u.groupNames).join(", ")}
            </span>
          ) : u.batches > 1 && isLab && (
            <span className="text-[9px] font-bold bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded shadow-sm border border-outline-variant/10">
              ×{u.batches} Batches
            </span>
          )}
        </div>
        {u.day === new Date().getDay() && (
          isCancelled ? (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onRestore(u); }}
              title="Undo Cancellation"
              className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors border border-primary/20 ml-2"
            >
              Restore
            </button>
          ) : (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onCancel(u); }}
              title="Cancel Today's Class"
              className="text-[10px] bg-error/10 hover:bg-error/20 text-error px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors border border-error/20 ml-2"
            >
              Cancel
            </button>
          )
        )}
      </div>
      <p className="text-xs font-bold leading-tight text-on-surface mb-2">
        {isCancelled ? <del>{u.subject?.code} {u.subject?.name ? `— ${u.subject.name}` : ""}</del> : <>{u.subject?.code} {u.subject?.name ? `— ${u.subject.name}` : ""}</>}
      </p>
      <div className="mt-auto flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant flex-wrap">
          <span className="material-symbols-outlined text-[12px] opacity-70">groups</span>
          <span>Sem: {Array.from(u.classes).join(", ")}</span>
        </div>
        {u.room?.name && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant flex-wrap">
            <span className="material-symbols-outlined text-[12px] opacity-70">location_on</span>
            <span>Room: {u.room.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SlotRow({ slot, daysArray, grid, skipSlots, onCancel, onRestore }: { slot: number, daysArray: number[], grid: any, skipSlots: Set<string>, onCancel: (u: any) => void, onRestore: (u: any) => void }) {
  return (
    <Fragment key={`slotGroup-${slot}`}>
      {/* Slot Header */}
      <div className="flex flex-col justify-center items-center bg-surface-container-low border-r border-b border-outline-variant/10 p-2 slot-cell min-h-[85px]">
        <span className="text-[13px] font-black text-on-surface bg-surface-container-high px-2 py-0.5 rounded shadow-sm mb-0.5">
          {SLOT_TIMES[slot]?.label}
        </span>
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter text-center">
          {SLOT_TIMES[slot]?.start}<br/>{SLOT_TIMES[slot]?.end}
        </span>
      </div>

      {/* Day Cells */}
      {daysArray.map((day: number) => {
        if (skipSlots.has(`${day}-${slot}`)) return null;

        const cellEntries = grid[slot]?.[day] || [];
        
        if (cellEntries.length === 0) {
          return (
            <div key={`${day}-${slot}`} className="border-b border-r border-outline-variant/5 bg-surface-container-lowest/20 hover:bg-surface-container-lowest/50 transition-colors h-full" />
          );
        }

        const hasLab = cellEntries.some((e: any) => e.entryType === "LAB");
        const rowSpan = hasLab ? 2 : 1;
        const uniqueSubjects = getUniqueSubjects(cellEntries);

        return (
          <div 
            key={`${day}-${slot}`} 
            style={{ gridRow: `span ${rowSpan} / span ${rowSpan}` }}
            className="border-b border-r border-outline-variant/10 bg-surface-container-lowest/20 h-full p-1 hover:bg-surface-container-lowest/50 transition-colors"
          >
            <div className="flex flex-col gap-1.5 h-full">
              {uniqueSubjects.map((u: any, i: number) => (
                <CellCard key={i} u={u} onCancel={onCancel} onRestore={onRestore} />
              ))}
            </div>
          </div>
        );
      })}
    </Fragment>
  );
}

export default function TeacherPortalTimetablePage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; entry: any | null; reason: string; submitting: boolean }>({
    isOpen: false, entry: null, reason: "", submitting: false
  });
  
  const [toast, setToast] = useState<{ visible: boolean; timeLeft: number; entryId: number | null }>({
    visible: false, timeLeft: 0, entryId: null
  });

  const loadData = async (active = true) => {
    try {
      const me = await teacherMeApi.get();
      const schedule = await timetableApi.getTeacherSchedule(me.id);

      const cancels = schedule.cancellations || [];
      const cancelSet = new Set(cancels.map((c: any) => c.timetableEntryId));

      // Map lab entries to the common TimetableEntry shape
      const mappedLabs = schedule.labEntries.map((l: any) => ({
        id: l.id + 100000,
        timetableEntryId: l.timetableEntry.id,
        day: l.timetableEntry.day,
        slot: l.timetableEntry.slot,
        slotId: l.timetableEntry.slotId,
        entryType: "LAB" as const,
        subject: l.subject ?? l.timetableEntry.subject,
        room: l.lab,
        teacher: schedule.teacher,
        classSection: l.timetableEntry.classSection,
        groupName: l.groupName,
        isCancelled: cancelSet.has(l.timetableEntry.id),
      }));

      const allEntries = [...schedule.theoryEntries.map((t: any) => ({ ...t, isCancelled: cancelSet.has(t.id) })), ...mappedLabs].sort((a, b) => {
        if (a.day === b.day) return a.slot.order - b.slot.order;
        return a.day - b.day;
      });

      if (active) {
        setTeacher(me);
        setEntries(allEntries as unknown as TimetableEntry[]);
      }
    } catch (err: unknown) {
      if (active) setError(err instanceof Error ? err.message : "Failed to load schedule.");
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    loadData(active);
    return () => { active = false; };
  }, []);

  const handleCancelClick = (entry: any) => {
    setCancelModal({ isOpen: true, entry, reason: "", submitting: false });
  };

  const confirmCancel = async () => {
    const entryId = cancelModal.entry?.timetableEntryId ?? cancelModal.entry?.id;
    if (!entryId) return;

    setCancelModal(prev => ({ ...prev, submitting: true }));
    try {
      await timetableApi.cancelToday(entryId, cancelModal.reason || undefined);
      setCancelModal({ isOpen: false, entry: null, reason: "", submitting: false });
      setToast({ visible: true, timeLeft: 30, entryId });
      // We don't necessarily need to reload data if the UI doesn't visually hide cancelled classes locally yet, 
      // but in the public UI we do. Wait, in teacher portal we don't visualize cancelled logic? 
      // Actually we should reload or handle optimistic.
      loadData(true);
    } catch (err: any) {
      alert(err.message || "Failed to cancel class.");
      setCancelModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const undoCancel = async () => {
    if (!toast.entryId) return;
    try {
      await timetableApi.undoCancelToday(toast.entryId);
      setToast({ visible: false, timeLeft: 0, entryId: null });
      loadData(true);
    } catch (err: any) {
      alert(err.message || "Failed to undo cancellation.");
    }
  };

  const handleRestoreClick = async (entry: any) => {
    const entryId = entry?.timetableEntryId ?? entry?.id;
    if (!entryId) return;
    try {
      await timetableApi.undoCancelToday(entryId);
      loadData(true);
    } catch (err: any) {
      alert(err.message || "Failed to restore class.");
    }
  };

  useEffect(() => {
    if (toast.visible && toast.timeLeft > 0) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 })), 1000);
      return () => clearTimeout(timer);
    } else if (toast.visible && toast.timeLeft <= 0) {
      setToast(prev => ({ ...prev, visible: false, entryId: null }));
    }
  }, [toast]);

  const daysArray = [1, 2, 3, 4, 5, 6];
  const slotArray = [1, 2, 3, 4, 5, 6];

  const { grid, skipSlots } = useMemo(() => {
    const g: Record<number, Record<number, TimetableEntry[]>> = {};
    for (const s of slotArray) {
      g[s] = {};
      for (const d of daysArray) {
        g[s][d] = [];
      }
    }

    for (const e of entries) {
      const s = e.slot.order;
      const d = e.day;
      if (g[s]?.[d]) {
        g[s][d].push(e);
      }
    }

    const skips = new Set<string>();
    for (const s of slotArray) {
      for (const d of daysArray) {
        if (g[s][d].some(e => e.entryType === "LAB")) {
          skips.add(`${d}-${s + 1}`);
        }
      }
    }

    return { grid: g, skipSlots: skips };
  }, [entries]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter text-on-surface italic">
            My Timetable
          </h2>
          <p className="text-on-surface-variant text-sm font-medium">
            Your personal schedule for the current academic year.
          </p>
        </div>
        {teacher && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/10 text-sm font-bold text-on-surface">
            <span className="material-symbols-outlined text-base text-secondary">person</span>
            {teacher.abbreviation} — {teacher.name}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-on-surface-variant font-semibold uppercase tracking-widest animate-pulse">
            Loading schedule...
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-outline-variant/20 rounded-xl">
          <span className="material-symbols-outlined text-5xl text-outline-variant/30 mb-4">
            event_busy
          </span>
          <p className="text-sm font-bold text-on-surface-variant mb-1">No Schedule Found</p>
          <p className="text-xs text-on-surface-variant/60">
            Your timetable hasn&apos;t been published yet. Check back later or contact admin.
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-highest rounded-xl shadow-sm border border-outline-variant/10 overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header */}
            <div className="grid grid-cols-[90px_repeat(6,1fr)] bg-surface-container-low border-b border-outline-variant/10">
              <div className="p-4 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Time
              </div>
              {daysArray.map(d => (
                <div key={d} className="p-4 text-center font-black text-xs uppercase tracking-widest text-on-surface">
                  {DAY_SHORT[d] ?? DAY_LABELS[d]}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="timetable-grid" style={{ gridTemplateColumns: '90px repeat(6, 1fr)' }}>
              {/* Morning Slots (1-3) */}
              {[1, 2, 3].map(slot => (
                <SlotRow key={slot} slot={slot} daysArray={daysArray} grid={grid} skipSlots={skipSlots} onCancel={handleCancelClick} onRestore={handleRestoreClick} />
              ))}

              {/* Lunch Break Row */}
              <div style={{ gridColumn: '1 / -1' }} className="h-10 flex items-center justify-center bg-surface-container-highest border-y border-outline-variant/10">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">
                  Lunch Break (12:45 - 14:00)
                </span>
              </div>

              {/* Afternoon Slots (4-6) */}
              {[4, 5, 6].map(slot => (
                <SlotRow key={slot} slot={slot} daysArray={daysArray} grid={grid} skipSlots={skipSlots} onCancel={handleCancelClick} onRestore={handleRestoreClick} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {entries.length > 0 && (
        <div className="flex items-center gap-6 text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-indigo-600/20 border border-indigo-600/30" />
            Lecture / Theory
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-tertiary-container border border-tertiary" />
            Lab (2-slot block)
          </div>
        </div>
      )}
      {/* Undo Toast */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 bg-surface-container-highest border border-outline-variant/30 shadow-lg rounded-xl p-4 flex flex-col gap-2 z-50 min-w-[280px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-on-surface">Class Cancelled</span>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded shadow-inner border border-outline-variant/10">
              {toast.timeLeft}s
            </span>
          </div>
          <button
            onClick={undoCancel}
            className="w-full py-1.5 bg-primary text-on-primary rounded font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all border border-primary/20"
          >
            UNDO CANCELLATION
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-bold text-on-surface">Cancel Class Today</h3>
              <button 
                onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
                className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
                title="Close"
              >
                close
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-sm font-medium text-on-surface-variant">
                Are you sure you want to cancel <strong className="text-on-surface">{cancelModal.entry?.subject?.code}</strong> today?
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Teacher unwell, Lab unavailable"
                  className="px-3 py-2 bg-surface-container-highest border border-outline-variant/30 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 transition-colors"
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="p-4 border-t border-outline-variant/10 flex justify-end gap-3 bg-surface-container-low/20">
              <button
                onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
                className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors border border-transparent"
                disabled={cancelModal.submitting}
              >
                Keep Class
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 text-sm font-black bg-error text-on-error hover:bg-error/90 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                disabled={cancelModal.submitting}
              >
                {cancelModal.submitting && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
