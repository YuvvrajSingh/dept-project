"use client";

import React, { useEffect, useState, useMemo, Fragment, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { publicApi, subjectApi } from "@/lib/api";
import type { ClassSection, TimetableMatrix, SlotData, Subject, AcademicYear } from "@/lib/types";
import { SLOT_TIMES, DAY_SHORT } from "@/lib/types";

function PublicTimetableInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBranch = searchParams.get("branch");
  const initialSemester = searchParams.get("semester");

  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [branch, setBranch] = useState<string | null>(initialBranch);
  const [semester, setSemester] = useState<number | null>(initialSemester ? Number(initialSemester) : null);

  const [matrix, setMatrix] = useState<TimetableMatrix | null>(null);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const year = await publicApi.getActiveYear();
        setActiveYear(year);
        const [c, s] = await Promise.all([
          publicApi.getClasses(year.id),
          subjectApi.list().catch(() => []), // Assuming subjects list doesn't strictly need auth for basic info, if it does we'd need a public subject endpoint. Let's see if it works, otherwise we can rely on subjectCode.
        ]);
        setClasses(c);
        setSubjects(s);
      } catch (err) {
        console.error("Failed to load public data", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const availableBranches = useMemo(() =>
    [...new Set(classes.map(c => c.branch?.name).filter(Boolean))].sort() as string[],
  [classes]);

  const availableSemesters = useMemo(() => {
    const sems = [...new Set(classes.filter(c => c.branch?.name === branch).map(c => c.semester))].sort((a, b) => a - b);
    return sems;
  }, [classes, branch]);

  // Handle URL updates when filters change
  useEffect(() => {
    if (!loading && branch && semester) {
      const params = new URLSearchParams();
      params.set("branch", branch);
      params.set("semester", semester.toString());
      router.replace(`?${params.toString()}`);
      
      const match = classes.filter(c => c.branch?.name === branch && c.semester === semester);
      if (match.length === 1) {
        loadClassView(match[0].id);
      } else {
        setMatrix(null);
      }
    } else if (!loading && (!branch || !semester)) {
       setMatrix(null);
    }
  }, [branch, semester, classes, loading, router]);


  async function loadClassView(classId: string) {
    setMatrixLoading(true);
    try {
      const [m, cancels] = await Promise.all([
        publicApi.getMatrix(classId),
        publicApi.getTodayCancellations(classId).catch(() => [])
      ]);
      setMatrix(m);
      setCancellations(cancels || []);
    } catch {
      setMatrix(null);
      setCancellations([]);
    } finally {
      setMatrixLoading(false);
    }
  }

  const subjectById = Object.fromEntries(subjects.map(s => [s.id, s]));

  function renderSlotCell(slotData: SlotData) {
    if (!slotData) return <div className="bg-surface-container-lowest m-0.5 p-1.5 md:p-3 rounded opacity-20 slot-cell" />;
    if (slotData.type === "LAB_CONTINUATION") return null;

    const isCancelled = cancellations.some(c => c.timetableEntryId === slotData.entryId);

    if (slotData.type === "THEORY") {
      return (
        <div className={`m-0.5 p-1.5 md:p-3 rounded shadow-sm border-l-4 slot-cell transition-all ${isCancelled ? "bg-surface-container-lowest/40 border-outline-variant/30 opacity-60 grayscale" : "bg-surface-container-lowest border-indigo-600"}`}>
          <div className={`text-[8px] md:text-[10px] font-bold mb-1 ${isCancelled ? "text-error" : "text-indigo-600"}`}>
            {isCancelled ? "CANCELLED" : "THEORY"}
          </div>
          <div className="text-[11px] md:text-sm font-bold text-on-surface leading-tight">
            {isCancelled ? <del>{subjectById[slotData.subjectId]?.abbreviation ?? slotData.subjectCode}</del> : (subjectById[slotData.subjectId]?.abbreviation ?? slotData.subjectCode)}
          </div>
          <div className="mt-1 md:mt-2 text-[8px] md:text-[10px] text-on-surface-variant line-clamp-1">{slotData.teacherAbbr} // {slotData.roomName}</div>
        </div>
      );
    }
    if (slotData.type === "LAB") {
      return (
        <div className={`lab-merged-cell m-0.5 p-1.5 md:p-3 rounded shadow-sm border-l-4 transition-all ${isCancelled ? "bg-surface-container-lowest/40 border-outline-variant/30 opacity-60 grayscale" : "bg-surface-container-lowest border-tertiary-container"}`}>
          <div className={`text-[8px] md:text-[10px] font-bold mb-1 uppercase tracking-tighter ${isCancelled ? "text-error" : "text-on-tertiary-container"}`}>
            {isCancelled ? "CANCELLED" : "LAB"}
          </div>
          <div className="text-[11px] md:text-sm font-bold text-on-surface leading-tight">
            {isCancelled ? <del>LABS</del> : "LABS"}
          </div>
          <div className="mt-2 space-y-1">
            {Object.entries(slotData.groups).map(([g, info]) => (
              <div key={g} className="text-[9px] bg-surface-container-low p-1 rounded font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                {g}: {info.teacher} @ {info.lab}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center p-8"><div className="animate-pulse text-on-surface-variant font-bold uppercase tracking-widest text-sm">Loading Schedule Data...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-surface-container border-b border-outline-variant/20 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tighter italic">Class Timetable</h1>
            {activeYear && <p className="text-xs font-bold text-on-surface-variant">Academic Year: {activeYear.startYear}-{activeYear.startYear+1}</p>}
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/10 shadow-sm w-full md:w-auto">
             <div className="flex flex-col flex-1 min-w-30">
              <label className="text-[9px] font-bold uppercase text-on-surface-variant px-2">Branch</label>
              <select
                value={branch ?? ""}
                onChange={(e) => setBranch(e.target.value)}
                className="appearance-none bg-transparent border-none px-2 py-1 text-sm font-bold outline-none cursor-pointer w-full"
              >
              <option value="" disabled>Select Branch</option>
                {availableBranches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="w-px h-8 bg-outline-variant/20 hidden md:block"></div>
            <div className="flex flex-col flex-1 min-w-35">
              <label className="text-[9px] font-bold uppercase text-on-surface-variant px-2">Semester</label>
              <select
                value={semester ?? ""}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="appearance-none bg-transparent border-none px-2 py-1 text-sm font-bold outline-none cursor-pointer w-full md:min-w-30"
              >
                <option value="" disabled>Select Semester</option>
                {availableSemesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
      </div>

      <div className="p-3 md:p-8 max-w-350 mx-auto">
        {matrixLoading ? (
            <div className="py-20 text-center text-sm font-bold text-on-surface-variant animate-pulse">Loading Matrix...</div>
        ) : matrix ? (
            <>
              {cancellations.length > 0 && (
                <div className="bg-error-container/10 border-l-[6px] border-error rounded-xl p-4 md:p-5 mb-8 shadow-sm">
                  <div className="flex items-center gap-2.5 text-error mb-4">
                    <span className="material-symbols-outlined text-2xl">priority_high</span>
                    <h3 className="font-black tracking-tight text-lg md:text-xl">Classes Cancelled Today</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cancellations.map(c => (
                      <div key={c.timetableEntryId} className="bg-surface-container-lowest border border-error/20 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="min-w-[32px] h-[32px] rounded-full bg-error/10 text-error flex items-center justify-center font-black text-sm">
                            {c.slotOrder}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface text-sm">{c.subjectLabel}</span>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">SLOT {c.slotOrder}</span>
                          </div>
                        </div>
                        {c.reason && (
                          <div className="bg-error-container/30 text-on-error-container text-xs font-bold px-3 py-1.5 rounded-md border border-error/10 italic self-start sm:self-auto">
                            &quot;{c.reason}&quot;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-surface-container-highest rounded-xl shadow-sm border border-outline-variant/10">
              <div className="overflow-x-auto">
                <div className="min-w-200">
                <div className="grid grid-cols-[56px_repeat(6,1fr)] md:grid-cols-[80px_repeat(6,1fr)] bg-surface-container-low border-b border-outline-variant/10">
                    <div className="p-4" />
                    {[1,2,3,4,5,6].map((d) => (
                    <div key={d} className="p-2 md:p-4 text-center font-black text-[10px] md:text-xs uppercase tracking-widest text-on-surface">
                      <span className="md:hidden">{DAY_SHORT[d][0]}</span>
                      <span className="hidden md:inline">{DAY_SHORT[d]}</span>
                    </div>
                    ))}
                </div>
                <div className="timetable-grid">
                    {[1,2,3].map((slot) => (
                    <Fragment key={`slotGroup-${slot}`}>
                        <div key={`l-${slot}`} className="flex flex-col justify-center items-center bg-surface-container-low border-r border-b border-outline-variant/10 p-1 md:p-2 slot-cell">
                        <span className="text-[10px] md:text-xs font-black text-on-surface">{SLOT_TIMES[slot].label}</span>
                        <span className="hidden md:block text-[9px] text-on-surface-variant font-medium">{SLOT_TIMES[slot].start}</span>
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
                      <div key={`l-${slot}`} className="flex flex-col justify-center items-center bg-surface-container-low border-r border-b border-outline-variant/10 p-1 md:p-2 slot-cell">
                      <span className="text-[10px] md:text-xs font-black text-on-surface">{SLOT_TIMES[slot].label}</span>
                      <span className="hidden md:block text-[9px] text-on-surface-variant font-medium">{SLOT_TIMES[slot].start}</span>
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
            </div>
            </>
        ) : (
             <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-outline-variant/20 rounded-xl">
                 <span className="material-symbols-outlined text-5xl text-outline-variant/30 mb-4">grid_view</span>
                 <p className="text-sm font-bold text-on-surface-variant mb-1">No Schedule Loaded</p>
                 <p className="text-xs text-on-surface-variant/60">Select a Branch and Semester to view the timetable.</p>
             </div>
        )}
      </div>

    </div>
  );
}

export default function PublicTimetablePage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse text-center w-full min-h-screen items-center flex justify-center uppercase tracking-widest text-on-surface-variant font-bold text-sm">Loading...</div>}>
      <PublicTimetableInner />
    </Suspense>
  );
}
