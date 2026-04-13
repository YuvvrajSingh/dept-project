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

function CellCard({ u }: { u: any }) {
  const isLab = u.entryType === "LAB";
  const wrapperClasses = isLab 
    ? "border-l-[4px] border-l-tertiary-container bg-surface-container-lowest border border-outline-variant/10 shadow-sm"
    : "border-l-[4px] border-l-indigo-600 bg-surface-container-lowest border border-outline-variant/10 shadow-sm";
  const badgeClasses = isLab
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
      </div>
      <p className="text-xs font-bold leading-tight text-on-surface mb-2">
        {u.subject?.code} {u.subject?.name ? `— ${u.subject.name}` : ""}
      </p>
      <div className="mt-auto flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant flex-wrap">
          <span className="material-symbols-outlined text-[12px] opacity-70">groups</span>
          <span>{Array.from(u.classes).join(", ")}</span>
        </div>
        {u.room?.name && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant flex-wrap">
            <span className="material-symbols-outlined text-[12px] opacity-70">location_on</span>
            <span>{u.room.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SlotRow({ slot, daysArray, grid, skipSlots }: { slot: number, daysArray: number[], grid: any, skipSlots: Set<string> }) {
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
                <CellCard key={i} u={u} />
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

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const me = await teacherMeApi.get();
        const schedule = await timetableApi.getTeacherSchedule(me.id);

        // Map lab entries to the common TimetableEntry shape
        const mappedLabs = schedule.labEntries.map((l: any) => ({
          id: l.id + 100000,
          day: l.timetableEntry.day,
          slot: l.timetableEntry.slot,
          slotId: l.timetableEntry.slotId,
          entryType: "LAB" as const,
          subject: l.subject ?? l.timetableEntry.subject,
          room: l.lab,
          teacher: schedule.teacher,
          classSection: l.timetableEntry.classSection,
          groupName: l.groupName,
        }));

        const allEntries = [...schedule.theoryEntries, ...mappedLabs].sort((a, b) => {
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
    }
    load();
    return () => { active = false; };
  }, []);

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
                <SlotRow key={slot} slot={slot} daysArray={daysArray} grid={grid} skipSlots={skipSlots} />
              ))}

              {/* Lunch Break Row */}
              <div style={{ gridColumn: '1 / -1' }} className="h-10 flex items-center justify-center bg-surface-container-highest border-y border-outline-variant/10">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">
                  Lunch Break (12:45 - 14:00)
                </span>
              </div>

              {/* Afternoon Slots (4-6) */}
              {[4, 5, 6].map(slot => (
                <SlotRow key={slot} slot={slot} daysArray={daysArray} grid={grid} skipSlots={skipSlots} />
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
    </div>
  );
}
