"use client";

import React, { useEffect, useState, useMemo, Fragment, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { classApi, timetableApi, teacherApi, roomApi, subjectApi } from "@/lib/api";
import type { ClassSection, TimetableMatrix, Teacher, Room, TimetableEntry, SlotData, Subject } from "@/lib/types";
import { SLOT_TIMES, DAY_SHORT, DAY_LABELS } from "@/lib/types";

type ViewMode = "class" | "teacher" | "room";

function TimetableViewsInner() {
  const searchParams = useSearchParams();
  const initTeacherId = searchParams.get("teacherId");
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
    async function init() {
      const [c, t, r, s] = await Promise.all([
        classApi.list().catch(() => []),
        teacherApi.list().catch(() => []),
        roomApi.list().catch(() => []),
        subjectApi.list().catch(() => []),
      ]);
      setClasses(c);
      setTeachers(t);
      setRooms(r);
      setSubjects(s);

      if (initTeacherId) {
         const tIdNum = parseInt(initTeacherId, 10);
         if (t.find((x: Teacher) => x.id === tIdNum)) {
            setViewMode("teacher");
            loadTeacherView(tIdNum);
         }
      }
    }
    init();
  }, [initTeacherId]);

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
      const e = await timetableApi.getTeacherSchedule(teacherId);
      const mappedLabs = e.labEntries.map((l: any) => ({
        id: l.id + 100000,
        day: l.timetableEntry.day,
        slotStart: l.timetableEntry.slotStart,
        slotEnd: l.timetableEntry.slotEnd,
        entryType: "LAB",
        subject: l.subject ?? l.timetableEntry.subject,
        room: l.lab,
        teacher: e.teacher,
        classSection: l.timetableEntry.classSection
      }));
      const allEntries = [...e.theoryEntries, ...mappedLabs].sort((a, b) => {
        if (a.day === b.day) return a.slotStart - b.slotStart;
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
      const e = await timetableApi.getRoomOccupancy(roomId);
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
          <button
            onClick={handleExportPdf}
            className="h-[42px] px-6 bg-primary-container text-white font-bold text-sm rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Export / Print
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-16 text-center text-sm text-on-surface-variant">Loading schedule...</div>
      ) : viewMode === "class" && matrix ? (
        <div className="bg-surface-container-highest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
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
      ) : (viewMode === "teacher" || viewMode === "room") && entries.length > 0 ? (
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Day</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Slot</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Class</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Subject</th>
                {viewMode === "room" && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Teacher</th>}
                {viewMode === "teacher" && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Room</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-4 text-sm font-bold">{DAY_LABELS[e.day]}</td>
                  <td className="px-6 py-4 text-sm">{SLOT_TIMES[e.slotStart]?.label}{e.slotEnd !== e.slotStart ? `-${SLOT_TIMES[e.slotEnd]?.label}` : ""}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                      e.entryType === "THEORY" ? "bg-primary-fixed text-on-primary-fixed-variant" : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                    }`}>{e.entryType}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold whitespace-nowrap text-on-surface-variant">
                    {e.classSection?.branch?.name} Sem {e.classSection?.semester}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">{e.subject?.name ?? e.subject?.code ?? "—"}</td>
                  {viewMode === "room" && <td className="px-6 py-4 text-sm">{e.teacher?.abbreviation ?? "—"}</td>}
                  {viewMode === "teacher" && <td className="px-6 py-4 text-sm">{e.room?.name ?? "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
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
