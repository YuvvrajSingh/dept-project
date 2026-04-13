"use client";

import React, { useEffect, useState, useMemo, Fragment, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { classApi, timetableApi, teacherApi, roomApi, subjectApi } from "@/lib/api";
import { useAcademicYear } from "@/contexts/academic-year-context";
import type { ClassSection, TimetableMatrix, Teacher, Room, TimetableEntry, SlotData, Subject } from "@/lib/types";
import { SLOT_TIMES, DAY_SHORT, DAY_LABELS } from "@/lib/types";

type ViewMode = "class" | "teacher" | "room";

const getClassLabel = (e: any) => {
  if (e.classSection?.branch?.name) {
    return `${e.classSection.branch.name}-${e.classSection.semester}`;
  }
  return "Unknown Class";
};

const getUniqueEntries = (cellEntries: any[]) => {
  const unique = new Map<string, any>();
  for (const e of cellEntries) {
    const key = `${e.subject?.id ?? e.subject?.code}-${e.entryType}`;
    if (!unique.has(key)) {
      unique.set(key, { 
        ...e, 
        batches: 1, 
        groupNames: e.groupName ? new Set([e.groupName]) : new Set(),
        classes: new Set([getClassLabel(e)]),
        teachers: new Set([e.teacher?.abbreviation].filter(Boolean))
      });
    } else {
      const u = unique.get(key);
      u.batches += 1;
      if (e.groupName) u.groupNames.add(e.groupName);
      u.classes.add(getClassLabel(e));
      if (e.teacher?.abbreviation) u.teachers.add(e.teacher.abbreviation);
    }
  }
  return Array.from(unique.values());
};

function EntryCellCard({ u, viewMode }: { u: any, viewMode: ViewMode }) {
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
        {viewMode === "teacher" && u.room?.name && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant flex-wrap">
            <span className="material-symbols-outlined text-[12px] opacity-70">location_on</span>
            <span>{u.room.name}</span>
          </div>
        )}
        {viewMode === "room" && u.teachers?.size > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant flex-wrap">
            <span className="material-symbols-outlined text-[12px] opacity-70">person</span>
            <span>{Array.from(u.teachers).join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EntrySlotRow({ slot, daysArray, grid, skipSlots, viewMode }: { slot: number, daysArray: number[], grid: any, skipSlots: Set<string>, viewMode: ViewMode }) {
  return (
    <Fragment key={`slotGroup-${slot}`}>
      <div className="flex flex-col justify-center items-center bg-surface-container-low border-r border-b border-outline-variant/10 p-2 slot-cell min-h-[85px]">
        <span className="text-[13px] font-black text-on-surface bg-surface-container-high px-2 py-0.5 rounded shadow-sm mb-0.5">
          {SLOT_TIMES[slot]?.label}
        </span>
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter text-center">
          {SLOT_TIMES[slot]?.start}<br/>{SLOT_TIMES[slot]?.end}
        </span>
      </div>

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
        const uniqueEntries = getUniqueEntries(cellEntries);

        return (
          <div 
            key={`${day}-${slot}`} 
            style={{ gridRow: `span ${rowSpan} / span ${rowSpan}` }}
            className="border-b border-r border-outline-variant/10 bg-surface-container-lowest/20 h-full p-1 hover:bg-surface-container-lowest/50 transition-colors"
          >
            <div className="flex flex-col gap-1.5 h-full">
              {uniqueEntries.map((u: any, i: number) => (
                <EntryCellCard key={i} u={u} viewMode={viewMode} />
              ))}
            </div>
          </div>
        );
      })}
    </Fragment>
  );
}

function TimetableViewsInner() {
  const searchParams = useSearchParams();
  const initTeacherId = searchParams.get("teacherId");
  const { selectedYear, loading: yearLoading } = useAcademicYear();
  const [viewMode, setViewMode] = useState<ViewMode>("class");
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  // Branch + Semester filters for class view
  const [branch, setBranch] = useState<string | null>(null);
  const [semester, setSemester] = useState<number | null>(null);

  const [matrix, setMatrix] = useState<TimetableMatrix | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const daysArray = useMemo(() => [1, 2, 3, 4, 5, 6], []);
  const slotArray = useMemo(() => [1, 2, 3, 4, 5, 6], []);

  const { grid, skipSlots } = useMemo(() => {
    const g: Record<number, Record<number, TimetableEntry[]>> = {};
    for (const s of slotArray) {
      g[s] = {};
      for (const d of daysArray) {
        g[s][d] = [];
      }
    }

    if (viewMode === "teacher" || viewMode === "room") {
      for (const e of entries) {
        if (!e.slot || !e.day) continue;
        const s = e.slot.order;
        const d = e.day;
        if (g[s]?.[d]) {
          g[s][d].push(e);
        }
      }
    }

    const skips = new Set<string>();
    for (const s of slotArray) {
      for (const d of daysArray) {
        if (g[s][d].some((e: any) => e.entryType === "LAB")) {
          skips.add(`${d}-${s + 1}`);
        }
      }
    }

    return { grid: g, skipSlots: skips };
  }, [entries, viewMode, daysArray, slotArray]);

  // Unique sorted branches derived from loaded class sections
  const availableBranches = useMemo(() =>
    [...new Set(classes.map(c => c.branch?.name).filter(Boolean))].sort() as string[],
  [classes]);

  // Auto-select first branch once classes load
  useEffect(() => {
    if (availableBranches.length > 0 && (branch === null || !availableBranches.includes(branch))) {
      setBranch(availableBranches[0]);
    }
  }, [availableBranches]);

  const availableSemesters = useMemo(() => {
    const sems = [...new Set(classes.filter(c => c.branch?.name === branch).map(c => c.semester))].sort((a, b) => a - b);
    return sems;
  }, [classes, branch]);

  // Auto-select first semester when branch changes or data loads
  useEffect(() => {
    if (availableSemesters.length > 0 && (semester === null || !availableSemesters.includes(semester))) {
      setSemester(availableSemesters[0]);
    }
  }, [availableSemesters]);

  useEffect(() => {
    if (yearLoading || !selectedYear) return;
    async function init() {
      const [c, t, r, s] = await Promise.all([
        classApi.list(selectedYear!.id).catch(() => []),
        teacherApi.list().catch(() => []),
        roomApi.list().catch(() => []),
        subjectApi.list().catch(() => []),
      ]);
      setClasses(c);
      setTeachers(t);
      setRooms(r);
      setSubjects(s);

      // Reset selections when year changes
      setBranch(null);
      setSemester(null);
      setSelectedClass(null);
      setSelectedTeacher(null);
      setSelectedRoom(null);
      setMatrix(null);
      setEntries([]);

      if (initTeacherId) {
         const tIdNum = parseInt(initTeacherId, 10);
         if (t.find((x: Teacher) => x.id === tIdNum)) {
            setViewMode("teacher");
            loadTeacherView(tIdNum);
         }
      }
    }
    init();
  }, [selectedYear, yearLoading, initTeacherId]);

  // Auto-load class timetable when branch+semester resolves to a section
  useEffect(() => {
    if (viewMode !== "class" || !semester || classes.length === 0) return;
    const match = classes.filter(c => c.branch?.name === branch && c.semester === semester);
    if (match.length === 1) {
      loadClassView(match[0].id);
    } else {
      setSelectedClass(null);
      setMatrix(null);
    }
  }, [branch, semester, classes, viewMode]);

  async function loadClassView(classId: number) {
    setSelectedClass(classId);
    setLoading(true);
    try {
      const m = await timetableApi.getMatrix(classId);
      setMatrix(m);
      setEntries([]);
    } catch {
      setMatrix(null);
    } finally {
      setLoading(false);
    }
  }

  // Define this using useCallback or leave it hoisted, but it's fine as is 
  // since it doesn't depend on much, though we're using it inside useEffect now.
  // We'll just define it inline above or disable the deps warning since it's safe.
  async function loadTeacherView(teacherId: number) {
    setSelectedTeacher(teacherId);
    setLoading(true);
    try {
      const e = await timetableApi.getTeacherSchedule(teacherId, selectedYear?.id);
      const mappedLabs = e.labEntries.map((l: any) => ({
        id: l.id + 100000,
        day: l.timetableEntry.day,
        slot: l.timetableEntry.slot,
        slotId: l.timetableEntry.slotId,
        entryType: "LAB" as const,
        subject: l.subject ?? l.timetableEntry.subject,
        room: l.lab,
        teacher: e.teacher,
        classSection: l.timetableEntry.classSection
      }));
      const allEntries = [...e.theoryEntries, ...mappedLabs].sort((a, b) => {
        if (a.day === b.day) return a.slot.order - b.slot.order;
        return a.day - b.day;
      });
      setEntries(allEntries as any);
      setMatrix(null);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoomView(roomId: number) {
    setSelectedRoom(roomId);
    setLoading(true);
    try {
      const e = await timetableApi.getRoomOccupancy(roomId, selectedYear?.id);
      setEntries(e.entries);
      setMatrix(null);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  const subjectById = Object.fromEntries(subjects.map(s => [s.id, s]));

  function renderSlotCell(slotData: SlotData) {
    if (!slotData) return <div className="bg-surface-container-lowest m-0.5 p-3 rounded opacity-20 slot-cell" />;
    if (slotData.type === "LAB_CONTINUATION") return null;
    if (slotData.type === "THEORY") {
      return (
        <div className="bg-surface-container-lowest m-0.5 p-3 rounded shadow-sm border-l-4 border-indigo-600 slot-cell">
          <div className="text-[10px] font-bold text-indigo-600 mb-1">THEORY</div>
          <div className="text-sm font-bold text-on-surface leading-tight">
            {subjectById[slotData.subjectId]?.abbreviation ?? slotData.subjectCode}
          </div>
          <div className="mt-2 text-[10px] text-on-surface-variant">{slotData.teacherAbbr} // {slotData.roomName}</div>
        </div>
      );
    }
    if (slotData.type === "LAB") {
      return (
        <div className="lab-merged-cell m-0.5 p-3 rounded shadow-sm border-l-4 border-tertiary-container bg-surface-container-lowest">
          <div className="text-[10px] font-bold text-on-tertiary-container mb-1 uppercase tracking-tighter">LAB</div>
          <div className="text-sm font-bold text-on-surface leading-tight">LABS</div>
          <div className="mt-2 space-y-1">
            {Object.entries(slotData.groups).map(([g, info]) => (
              <div key={g} className="text-[9px] bg-surface-container-low p-1 rounded font-bold">
                {g}: {info.teacher} @ {info.lab}
                {info.subjectId ? ` [${subjectById[info.subjectId]?.abbreviation ?? info.subjectCode}]` : ""}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  function handleExportPdf() {
    if (viewMode === "class" && selectedClass) {
      window.open(timetableApi.getExportPdfUrl(selectedClass), "_blank");
    } else {
      alert("Please select a class to export its timetable.");
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter text-on-surface italic">View Matrices</h2>
          <p className="text-on-surface-variant text-sm font-medium">
            Review conflict-free academic schedules across all dimensions.
          </p>
        </div>
        <div className="flex p-1 bg-surface-container-high rounded-lg">
          {(["class", "teacher", "room"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setViewMode(m); setMatrix(null); setEntries([]); }}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                viewMode === m ? "bg-surface-container-lowest text-secondary shadow-sm rounded-md" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              By {m}
            </button>
          ))}
        </div>
      </div>

      {/* Selector */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex gap-6 items-center">
        {viewMode === "class" ? (
          <>
            <div className="flex flex-col gap-2">
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Branch</label>
              <select
                value={branch ?? ""}
                onChange={(e) => setBranch(e.target.value)}
                className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-bold w-32 outline-none"
              >
              {availableBranches.length === 0 && <option value="">—</option>}
                {availableBranches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Semester</label>
              <select
                value={semester ?? ""}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-bold w-32 outline-none"
              >
                {availableSemesters.length === 0 && <option value="">—</option>}
                {availableSemesters.map((s) => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">
              {viewMode === "teacher" ? "Teacher" : "Room"}
            </label>
            {viewMode === "teacher" && (
              <select
                value={selectedTeacher ?? ""}
                onChange={(e) => loadTeacherView(parseInt(e.target.value))}
                className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-bold w-56 outline-none"
              >
                <option value="">Select teacher...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.abbreviation} - {t.name}</option>)}
              </select>
            )}
            {viewMode === "room" && (
              <select
                value={selectedRoom ?? ""}
                onChange={(e) => loadRoomView(parseInt(e.target.value))}
                className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-bold w-56 outline-none"
              >
                <option value="">Select room...</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>
        )}

        {viewMode === "class" && selectedClass && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const url = new URL(window.location.origin + '/timetable');
                if (branch) url.searchParams.set("branch", branch);
                if (semester) url.searchParams.set("semester", semester.toString());
                navigator.clipboard.writeText(url.toString());
                alert("Public link copied to clipboard!");
              }}
              className="h-[42px] px-4 bg-surface-container-high text-on-surface font-bold text-sm rounded-lg hover:bg-surface-container-highest transition-all flex items-center gap-2 border border-outline-variant/20"
              title="Copy Public Link"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              Share Link
            </button>
            <button
              onClick={handleExportPdf}
              className="h-[42px] px-6 bg-primary-container text-white font-bold text-sm rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Export / Print
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-16 text-center text-sm text-on-surface-variant">Loading schedule...</div>
      ) : viewMode === "class" && matrix ? (
        <div className="bg-surface-container-highest rounded-xl shadow-sm border border-outline-variant/10 overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-surface-container-low border-b border-outline-variant/10">
              <div className="p-4" />
            {[1,2,3,4,5,6].map((d) => (
              <div key={d} className="p-4 text-center font-black text-xs uppercase tracking-widest text-on-surface">{DAY_SHORT[d]}</div>
            ))}
          </div>
          <div className="timetable-grid">
            {[1,2,3].map((slot) => (
              <Fragment key={`slotGroup-${slot}`}>
                <div key={`l-${slot}`} className="flex flex-col justify-center items-center bg-surface-container-low border-r border-b border-outline-variant/10 p-2 slot-cell">
                  <span className="text-xs font-black text-on-surface">{SLOT_TIMES[slot].label}</span>
                  <span className="text-[9px] text-on-surface-variant font-medium">{SLOT_TIMES[slot].start}</span>
                </div>
                {[1,2,3,4,5,6].map((day) => {
                  const sd = matrix.timetable[String(day)]?.slots[String(slot)] ?? null;
                  if (sd?.type === "LAB_CONTINUATION") return null;
                  const rowSpan = sd?.type === "LAB" ? 2 : 1;
                  return (
                    <div 
                      key={`${day}-${slot}`} 
                      style={{ gridRow: `span ${rowSpan} / span ${rowSpan}` }}
                      className="h-full"
                    >
                      {renderSlotCell(sd)}
                    </div>
                  );
                })}
              </Fragment>
            ))}
            <div className="col-span-full h-10 flex items-center justify-center bg-surface-container-highest border-y border-outline-variant/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">Lunch Break</span>
            </div>
            {[4,5,6].map((slot) => (
              <Fragment key={`slotGroup-${slot}`}>
                <div key={`l-${slot}`} className="flex flex-col justify-center items-center bg-surface-container-low border-r border-b border-outline-variant/10 p-2 slot-cell">
                  <span className="text-xs font-black text-on-surface">{SLOT_TIMES[slot].label}</span>
                  <span className="text-[9px] text-on-surface-variant font-medium">{SLOT_TIMES[slot].start}</span>
                </div>
                {[1,2,3,4,5,6].map((day) => {
                  const sd = matrix.timetable[String(day)]?.slots[String(slot)] ?? null;
                  if (sd?.type === "LAB_CONTINUATION") return null;
                  const rowSpan = sd?.type === "LAB" ? 2 : 1;
                  return (
                    <div 
                      key={`${day}-${slot}`} 
                      style={{ gridRow: `span ${rowSpan} / span ${rowSpan}` }}
                      className="h-full"
                    >
                      {renderSlotCell(sd)}
                    </div>
                  );
                })}
              </Fragment>
            ))}
            </div>
          </div>
        </div>
      ) : (viewMode === "teacher" || viewMode === "room") && entries.length > 0 ? (
        <div className="bg-surface-container-highest rounded-xl shadow-sm border border-outline-variant/10 overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-surface-container-low border-b border-outline-variant/10">
              <div className="p-4 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Time</div>
              {daysArray.map((d) => (
                <div key={d} className="p-4 text-center font-black text-xs uppercase tracking-widest text-on-surface">{DAY_SHORT[d]}</div>
              ))}
            </div>
            
            <div className="timetable-grid" style={{ gridTemplateColumns: '80px repeat(6, 1fr)' }}>
              {[1, 2, 3].map(slot => (
                <EntrySlotRow key={slot} slot={slot} daysArray={daysArray} grid={grid} skipSlots={skipSlots} viewMode={viewMode} />
              ))}

              <div style={{ gridColumn: '1 / -1' }} className="h-10 flex items-center justify-center bg-surface-container-highest border-y border-outline-variant/10">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">Lunch Break</span>
              </div>

              {[4, 5, 6].map(slot => (
                <EntrySlotRow key={slot} slot={slot} daysArray={daysArray} grid={grid} skipSlots={skipSlots} viewMode={viewMode} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-outline-variant/20 rounded-xl">
          <span className="material-symbols-outlined text-5xl text-outline-variant/30 mb-4">grid_view</span>
          <p className="text-sm font-bold text-on-surface-variant mb-1">No Schedule Loaded</p>
          <p className="text-xs text-on-surface-variant/60">Select a {viewMode} from the dropdown above</p>
        </div>
      )}
    </div>
  );
}

export default function TimetableViewsPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading views...</div>}>
      <TimetableViewsInner />
    </Suspense>
  );
}
