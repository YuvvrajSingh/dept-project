"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { classApi, timetableApi, subjectApi, teacherApi, roomApi, labApi } from "@/lib/api";
import type { ClassSection, TimetableMatrix, Subject, Teacher, Room, Lab, SlotData } from "@/lib/types";

import { TimetableGrid } from "./components/TimetableGrid";
import { EntryForm } from "./components/EntryForm";
import { PreviewPanel } from "./components/PreviewPanel";

const BRANCHES = ["CSE", "IT", "AI"];
const YEARS = [2, 3, 4];

function TimetableBuilderInner() {
  const searchParams = useSearchParams();
  const initClassId = searchParams.get("classSectionId");
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);

  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState<number>(2);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const [matrix, setMatrix] = useState<TimetableMatrix | null>(null);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [teacherMap, setTeacherMap] = useState<Record<number, number[]>>({});

  const [loading, setLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: number; slot: number; data: SlotData | null } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [auditReport, setAuditReport] = useState<string[] | null>(null);

  useEffect(() => {
    async function init() {
      const [c, s, t, r, l] = await Promise.all([
        classApi.list().catch(() => []),
        subjectApi.list().catch(() => []), 
        teacherApi.list().catch(() => []),
        roomApi.list().catch(() => []),
        labApi.list().catch(() => []),
      ]);
      setClasses(c);
      setSubjects(s);
      setTeachers(t);
      setRooms(r);
      setLabs(l);

      // Pre-compute teacher-subject map
      const tMap: Record<number, number[]> = {};
      const tPromises = t.map(async (teacher) => {
        try {
          const tSubjects = await teacherApi.getSubjects(teacher.id);
          tMap[teacher.id] = tSubjects.map(ts => ts.subjectId);
        } catch (e) {
          tMap[teacher.id] = [];
        }
      });
      await Promise.all(tPromises);
      setTeacherMap(tMap);

      if (initClassId) {
         const classIdNum = parseInt(initClassId, 10);
         const targetClass = c.find((cls: ClassSection) => cls.id === classIdNum);
         if (targetClass) {
            setBranch(targetClass.branch.name);
            setYear(targetClass.year);
            setTimeout(() => {
               setSelectedClass(targetClass.id);
            }, 100);
         }
      }

    }
    init();
  }, []);

  const filteredClasses = useMemo(() => 
    classes.filter((c) => c.branch?.name === branch && c.year === year),
  [classes, branch, year]);

  useEffect(() => {
    setSelectedClass(null);
    setMatrix(null);
    setSelectedCell(null);
    setIsEditing(false);
  }, [branch, year]);

  async function loadTimetable(classId: number) {
    setLoading(true);
    setSelectedCell(null);
    setIsEditing(false);
    try {
      const m = await timetableApi.getMatrix(classId);
      setMatrix(m);
      
      try {
        const cSubjects = await classApi.getSubjects(classId);
        // Map ClassSubject entries back to pure Subject objects
        setClassSubjects(cSubjects.map(cs => cs.subject!).filter(Boolean));
      } catch (e) {
        setClassSubjects([]);
      }
    } catch {
      setMatrix(null);
    } finally {
      setLoading(false);
    }
  }

  const filledSlots = matrix ? Object.values(matrix.timetable).reduce((acc, currentDay) => {
    return acc + Object.values(currentDay.slots).filter((s) => s && s.type !== "LAB_CONTINUATION").length;
  }, 0) : 0;

  const handleDropEntry = async (sourceDay: number, sourceSlot: number, targetDay: number, targetSlot: number) => {
    if (!matrix || !selectedClass) return;
    
    // reset selection so weird bug is avoided
    setAuditReport(null);
    const sourceData = matrix.timetable[String(sourceDay)]?.slots[String(sourceSlot)];
    if (!sourceData || !("entryId" in sourceData)) return;

    const targetData = matrix.timetable[String(targetDay)]?.slots[String(targetSlot)];
    if (targetData) {
      alert("Target slot is already occupied. Please clear it first to avoid conflicts.");
      return;
    }

    setLoading(true);
    try {
      if (sourceData.type === "THEORY") {
        const payload = {
          classSectionId: matrix.classSectionId,
          day: targetDay,
          slotStart: targetSlot,
          entryType: "THEORY" as const,
          subjectId: sourceData.subjectId,
          teacherId: sourceData.teacherId!,
          roomId: sourceData.roomId!,
        };
        await timetableApi.updateEntry(sourceData.entryId, payload);
      } else if (sourceData.type === "LAB") {
        const payload = {
          classSectionId: matrix.classSectionId,
          day: targetDay,
          slotStart: targetSlot,
          entryType: "LAB" as const,
          subjectId: Object.values(sourceData.groups)[0]?.subjectId || 0,
          labGroups: Object.entries(sourceData.groups).map(([groupName, info]) => ({
            groupName,
            subjectId: info.subjectId || 0,
            labId: info.labId,
            teacherId: info.teacherId,
          })),
        };
        await timetableApi.updateEntry(sourceData.entryId, payload);
      }
      
      await loadTimetable(selectedClass);
    } catch (e: any) {
      alert("Scheduling Conflict: " + (e.message || "Failed to move entry"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-8">
      {/* Main Column */}
      <div className="flex-1 space-y-6">
        
        {/* Controls Panel */}
        <div className="flex items-end gap-6 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Branch</label>
            <select
              value={branch} onChange={(e) => setBranch(e.target.value)}
              className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-bold w-32 outline-none"
            >
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Year</label>
            <select
              value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-bold w-32 outline-none"
            >
              {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Class Section</label>
            <select
              value={selectedClass ?? ""}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedClass(id);
                if (id) loadTimetable(id);
              }}
              className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2.5 pr-10 text-sm font-bold w-48 outline-none"
            >
              <option value="">Select...</option>
              {filteredClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.branch?.name} - Year {c.year}</option>
              ))}
            </select>
          </div>

          <button
            disabled={!selectedClass || loading}
            onClick={async () => {
              if (!selectedClass) return;
              if (!confirm("This will wipe the current timetable for this class and heavily auto-generate a new one. Proceed?")) return;
              setLoading(true);
              setAuditReport(null);
              try {
                const res = await timetableApi.generateTimetable(selectedClass);
                setAuditReport(res.auditReport);
                await loadTimetable(selectedClass);
              } catch (e: any) {
                alert("Auto-generate failed: " + e.message);
              } finally {
                setLoading(false);
              }
            }}
            className="ml-auto h-[42px] px-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Magic Generate
          </button>

          <button
            disabled={!selectedClass}
            onClick={() => selectedClass && loadTimetable(selectedClass)}
            className="h-[42px] px-6 bg-primary-container text-white font-bold text-[11px] uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh List
          </button>
        </div>

        {auditReport && (
          <div className="bg-surface-container-lowest border-2 border-indigo-500/30 rounded-xl p-5 shadow-sm m-6 mt-0">
            <div className="flex items-center justify-between mb-3 border-b border-outline-variant/10 pb-2">
              <h3 className="font-bold text-indigo-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined">analytics</span>
                Auto-Generation Report
              </h3>
              <button onClick={() => setAuditReport(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-xs font-mono text-on-surface-variant">
              {auditReport.map((line, i) => (
                <li key={i} className={line.startsWith("Warning") ? "text-destructive font-bold" : line.startsWith("Success") ? "text-emerald-600 font-bold" : ""}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The Grid Component */}
        <TimetableGrid 
          matrix={matrix} 
          loading={loading} 
          filledSlots={filledSlots}
          onDropEntry={handleDropEntry}
          onCellClick={(day, slot, data) => {
            setSelectedCell({ day, slot, data });
            setIsEditing(false); // reset edit mode if clicking a new cell
          }}
        />
      </div>

      {/* Side Panel (Contextual Tools) */}
      <aside className="w-80 shrink-0">
        <div className="sticky top-24 space-y-4">
          
          {selectedCell && !isEditing && selectedCell.data && (
            <PreviewPanel 
              day={selectedCell.day}
              slot={selectedCell.slot}
              data={selectedCell.data}
              onClose={() => setSelectedCell(null)}
              onEdit={() => setIsEditing(true)}
              onDeleteSuccess={() => {
                setSelectedCell(null);
                if (selectedClass) loadTimetable(selectedClass);
              }}
            />
          )}

          {selectedCell && (isEditing || !selectedCell.data) && selectedClass && (
            <EntryForm 
              classSectionId={selectedClass}
              initialDay={selectedCell.day}
              initialSlot={selectedCell.slot}
              existingEntry={selectedCell.data}
              classSubjects={classSubjects.length ? classSubjects : subjects} // Fallback to all if class mapping is empty
              allTeachers={teachers}
              allRooms={rooms}
              allLabs={labs}
              teacherMap={teacherMap}
              onSuccess={() => {
                setSelectedCell(null);
                setIsEditing(false);
                loadTimetable(selectedClass);
              }}
              onClose={() => {
                setSelectedCell(null);
                setIsEditing(false);
              }}
            />
          )}

          {!selectedCell && (
             <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-lowest/50 text-on-surface-variant">
               <span className="material-symbols-outlined text-4xl mb-4 opacity-50">ads_click</span>
               <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                 Select a time slot
               </div>
               <div className="text-xs font-medium mt-1 opacity-60 px-6">
                 Click on any empty cell to schedule a class, or a filled cell to view details.
               </div>
             </div>
          )}

        </div>
      </aside>
    </div>
  );
}

export default function TimetableBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-on-surface-variant animate-pulse">Loading builder environment...</div>}>
      <TimetableBuilderInner />
    </Suspense>
  );
}
