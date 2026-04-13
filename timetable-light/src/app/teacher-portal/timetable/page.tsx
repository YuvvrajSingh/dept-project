"use client";

import { useEffect, useState } from "react";
import { teacherMeApi, timetableApi } from "@/lib/api";
import type { Teacher, TimetableEntry } from "@/lib/types";
import { DAY_LABELS, SLOT_TIMES } from "@/lib/types";

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

        // Map lab entries to the common TimetableEntry shape (same logic as timetable-views)
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
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Day
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Slot
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Type
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Subject
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Class
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Room / Lab
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {entries.map((e) => {
                const slotOrder = (e as any).slot?.order;
                const slotLabel = SLOT_TIMES[slotOrder]?.label ?? "—";
                const slotEnd =
                  e.entryType === "LAB" ? `–${SLOT_TIMES[slotOrder + 1]?.label ?? ""}` : "";

                return (
                  <tr key={e.id} className="hover:bg-surface-container-lowest/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-on-surface">
                      {DAY_LABELS[e.day] ?? `Day ${e.day}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant font-mono font-bold">
                      {slotLabel}{slotEnd}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                          e.entryType === "LAB"
                            ? "bg-tertiary-fixed/20 text-on-tertiary-fixed-variant"
                            : "bg-primary-fixed/20 text-on-primary-fixed-variant"
                        }`}
                      >
                        {e.entryType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-on-surface">
                      {e.subject?.name ?? e.subject?.code ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant font-bold">
                      {(e as any).classSection?.branch?.name
                        ? `${(e as any).classSection.branch.name} Sem ${(e as any).classSection.semester}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {e.room?.name ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {entries.length > 0 && (
        <div className="flex items-center gap-6 text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-primary-fixed/20" />
            Lecture / Theory
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-tertiary-fixed/20" />
            Lab (2-slot block)
          </div>
        </div>
      )}
    </div>
  );
}
