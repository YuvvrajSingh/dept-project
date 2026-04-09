"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { classApi, timetableApi, subjectApi, teacherApi, roomApi, labApi } from "@/lib/api";
import type { ClassSection, TimetableMatrix, Subject, Teacher, Room, Lab, SlotData } from "@/lib/types";

import { TimetableGrid } from "./components/TimetableGrid";
import { EntryForm } from "./components/EntryForm";
import { PreviewPanel } from "./components/PreviewPanel";


function TimetableBuilderInner() {
  const searchParams = useSearchParams();
  const initClassId = searchParams.get("classSectionId");
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);

  const [branch, setBranch] = useState<string | null>(null);
  const [semester, setSemester] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const [matrix, setMatrix] = useState<TimetableMatrix | null>(null);
  const [occupancyMap, setOccupancyMap] = useState<any>(null);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [draggedSubject, setDraggedSubject] = useState<Subject | null>(null);
  const [teacherMap, setTeacherMap] = useState<Record<number, number[]>>({});

  const [loading, setLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: number; slot: number; data: SlotData | null } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [auditReport, setAuditReport] = useState<string[] | null>(null);

  useEffect(() => {
    async function init() {
      const [c, s, t, r, l, occ] = await Promise.all([
        classApi.list().catch(() => []),
        subjectApi.list().catch(() => []), 
        teacherApi.list().catch(() => []),
        roomApi.list().catch(() => []),
        labApi.list().catch(() => []),
        timetableApi.getOccupancy().catch(() => null),
      ]);
      setClasses(c);
      setSubjects(s);
      setTeachers(t);
      setRooms(r);
      setLabs(l);
      if (occ) setOccupancyMap(occ);

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
            setSemester(targetClass.semester);
            setTimeout(() => {
               setSelectedClass(targetClass.id);
            }, 100);
         }
      }

    }
    init();
  }, []);

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

  // Unique sorted semesters for the selected branch
  const availableSemesters = useMemo(() => {
    const sems = [...new Set(classes.filter(c => c.branch?.name === branch).map(c => c.semester))].sort((a, b) => a - b);
    return sems;
  }, [classes, branch]);

  // Auto-select first semester when branch changes or semesters load
  useEffect(() => {
    if (availableSemesters.length > 0 && (semester === null || !availableSemesters.includes(semester))) {
      setSemester(availableSemesters[0]);
    }
  }, [availableSemesters]);

  const filteredClasses = useMemo(() =>
    classes.filter((c) => c.branch?.name === branch && c.semester === semester),
  [classes, branch, semester]);

  // Auto-load timetable whenever branch+semester resolves to a class section.
  // Deps are primitives (branch, semester) + stable classes array ref — never changes size.
  useEffect(() => {
    setSelectedCell(null);
    setIsEditing(false);
    setAuditReport(null);
    if (!semester) return;
    const match = classes.filter((c) => c.branch?.name === branch && c.semester === semester);
    if (match.length === 1) {
      setSelectedClass(match[0].id);
      loadTimetable(match[0].id);
    } else {
      setSelectedClass(null);
      setMatrix(null);
    }
  }, [branch, semester, classes]);

  // Load occupancy map whenever selected class changes
  useEffect(() => {
    if (selectedClass) {
       timetableApi.getOccupancy(selectedClass).then(occ => setOccupancyMap(occ)).catch(() => {});
    } else {
       timetableApi.getOccupancy().then(occ => setOccupancyMap(occ)).catch(() => {});
    }
  }, [selectedClass]);

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
        await timetableApi.updateEntry(sourceData.entryId as number, payload);
      } else if (sourceData.type === "LAB") {
        const payload = {
          classSectionId: matrix.classSectionId,
          day: targetDay,
          slotStart: targetSlot,
          entryType: "LAB" as const,
          subjectId: Object.values(sourceData.groups)[0]?.subjectId as number,
          labGroups: Object.entries(sourceData.groups).map(([g, info]) => ({
            groupName: g,
            labId: info.labId,
            teacherId: info.teacherId,
          })),
        };
        await timetableApi.updateEntry(sourceData.entryId as number, payload);
      }
      
      await Promise.all([
         timetableApi.getOccupancy(selectedClass).then(occ => setOccupancyMap(occ)).catch(() => {}),
         loadTimetable(selectedClass)
      ]);
    } catch (e: any) {
      alert(e.message || "Failed to move entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDropNewSubject = async (subject: Subject, day: number, slot: number) => {
    if (!matrix || !selectedClass) return;
    setAuditReport(null);

    // Pick first available teacher who can teach this
    const possibleTeachers = teachers.filter(t => teacherMap[t.id]?.includes(subject.id));
    let selectedTeacherId = possibleTeachers.find(t => !occupancyMap?.teachers?.[t.id]?.[day]?.includes(slot))?.id;
    if (!selectedTeacherId && possibleTeachers.length > 0) selectedTeacherId = possibleTeachers[0].id; // fallback to conflict

    setLoading(true);
    try {
      if (subject.type === "THEORY") {
         // Pick first available room
         let fallbackRoomId = rooms.find(r => !occupancyMap?.rooms?.[r.id]?.[day]?.includes(slot))?.id;
         if (!fallbackRoomId && rooms.length > 0) fallbackRoomId = rooms[0].id; // fallback
         
         await timetableApi.createEntry({
            classSectionId: selectedClass,
            day: day,
            slotStart: slot,
            entryType: "THEORY",
            subjectId: subject.id,
            teacherId: selectedTeacherId,
            roomId: fallbackRoomId,
         });
      } else if (subject.type === "LAB") {
         // Pick first available lab
         let fallbackLabId = labs.find(l => {
            const lBusy = occupancyMap?.labs?.[l.id]?.[day] || [];
            return !lBusy.includes(slot) && !lBusy.includes(slot + 1);
         })?.id;
         if (!fallbackLabId && labs.length > 0) fallbackLabId = labs[0].id;

         await timetableApi.createEntry({
            classSectionId: selectedClass,
            day: day,
            slotStart: slot,
            entryType: "LAB",
            subjectId: subject.id,
            labGroups: [
               { groupName: "A1", labId: fallbackLabId!, teacherId: selectedTeacherId! }
            ]
         });
      }
      // Re-fetch occupancy and timetable
      await Promise.all([
        timetableApi.getOccupancy().then(occ => setOccupancyMap(occ)).catch(() => {}),
        loadTimetable(selectedClass)
      ]);
    } catch (e: any) {
      alert(e.message || "Failed to schedule subject");
    } finally {
      setLoading(false);
    }
  };

  // Calculate Unassigned Subjects
  const unassignedSubjects = useMemo(() => {
     if (!matrix) return [];
     const required = new Map<number, number>();
     const assigned = new Map<number, number>();

     // initialize required
     classSubjects.forEach(s => {
        required.set(s.id, s.creditHours);
        assigned.set(s.id, 0);
     });

     // calculate assigned
     Object.values(matrix.timetable).forEach(day => {
        Object.values(day.slots).forEach(slot => {
           if (slot && slot.type !== "LAB_CONTINUATION") {
              if (slot.type === "THEORY" && slot.subjectId) {
                 const current = assigned.get(slot.subjectId) || 0;
                 assigned.set(slot.subjectId, current + 1);
              } else if (slot.type === "LAB") {
                 const sId = Object.values(slot.groups)[0]?.subjectId || null;
                 if (sId) {
                    const current = assigned.get(sId) || 0;
                    assigned.set(sId, current + 2); // LAB counts as 2 slots/credits
                 }
              }
           }
        });
     });

     return classSubjects.filter(s => {
        const req = required.get(s.id) || 0;
        const asg = assigned.get(s.id) || 0;
        return asg < req;
     }).map(s => ({
        ...s,
        assigned: assigned.get(s.id) || 0,
        required: required.get(s.id) || 0
     }));
  }, [matrix, classSubjects]);

  return (
    <div className="flex gap-8">
      {/* Main Column */}
      <div className="flex-1 space-y-6">
        
        {/* Controls Panel */}
        <div className="flex items-center gap-6 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">Branch</label>
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
            <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">Semester</label>
            <select
              value={semester ?? ""}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-bold w-32 outline-none"
            >
              {availableSemesters.length === 0 && <option value="">—</option>}
              {availableSemesters.map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>


          <div className="ml-auto flex items-center gap-3 flex-wrap justify-end pl-4">
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
              className="h-[42px] px-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Generate
            </button>

            <button
              disabled={!selectedClass || loading || (filledSlots === 0 && matrix != null)}
              onClick={async () => {
                if (!selectedClass) return;
                if (!confirm("Are you sure you want to completely erase the timetable for this class?")) return;
                setLoading(true);
                setAuditReport(null);
                try {
                  await timetableApi.clearTimetable(selectedClass);
                  // Clear out frontend grid state immediately
                  setMatrix(null);
                  await Promise.all([
                    timetableApi.getOccupancy(selectedClass).then(occ => setOccupancyMap(occ)).catch(() => {}),
                    loadTimetable(selectedClass)
                  ]);
                } catch (e: any) {
                  alert("Failed to clear timetable: " + e.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="h-[42px] px-4 bg-destructive text-destructive-foreground font-bold text-[11px] uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Clear
            </button>

            <button
              disabled={!selectedClass}
              onClick={() => selectedClass && loadTimetable(selectedClass)}
              className="h-[42px] px-4 bg-primary-container text-white font-bold text-[11px] uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </button>
          </div>
        </div>



        {/* The Grid Component */}
        <TimetableGrid 
          matrix={matrix} 
          loading={loading} 
          filledSlots={filledSlots}
          draggedSubject={draggedSubject}
          occupancyMap={occupancyMap}
          teacherMap={teacherMap}
          rooms={rooms}
          labs={labs}
          onDragSubjectEnd={() => setDraggedSubject(null)}
          onDropEntry={handleDropEntry}
          onDropNewSubject={handleDropNewSubject}
          onCellClick={(day, slot, data) => {
            setSelectedCell({ day, slot, data });
            setIsEditing(false); // reset edit mode if clicking a new cell
          }}
        />
      </div>

      {/* Side Panel (Contextual Tools) */}
      <aside className="w-80 shrink-0">
        <div className="sticky top-24 space-y-4">
          
          {selectedCell && !isEditing && selectedCell.data && selectedClass && (
            <PreviewPanel 
              day={selectedCell.day}
              slot={selectedCell.slot}
              data={selectedCell.data}
              onClose={() => setSelectedCell(null)}
              onEdit={() => setIsEditing(true)}
              onDeleteSuccess={() => {
                 setSelectedCell(null);
                 timetableApi.getOccupancy(selectedClass).then(occ => setOccupancyMap(occ)).catch(() => {});
                 loadTimetable(selectedClass);
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
                timetableApi.getOccupancy().then(occ => setOccupancyMap(occ)).catch(() => {});
                loadTimetable(selectedClass);
              }}
              onClose={() => {
                setSelectedCell(null);
                setIsEditing(false);
              }}
            />
          )}

           {!selectedCell && unassignedSubjects.length > 0 && selectedClass && (
             <div className="flex-1 flex flex-col pt-6">
                <h3 className="font-bold text-sm text-on-surface mb-4 uppercase tracking-wider flex items-center gap-2">
                   <span className="material-symbols-outlined text-[16px] text-tertiary">inventory_2</span>
                   Unassigned Subjects
                </h3>
                <div className="space-y-3 overflow-y-auto pr-2 pb-20">
                   {unassignedSubjects.map(s => (
                      <div 
                         key={s.id} 
                         draggable
                         onDragStart={(e) => {
                            e.dataTransfer.setData("application/json-subject", JSON.stringify(s.id));
                            setDraggedSubject(s);
                         }}
                         onDragEnd={() => setDraggedSubject(null)}
                         className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg shadow-sm hover:border-tertiary cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                      >
                         <div>
                            <div className="font-bold text-sm text-on-surface leading-tight">{s.code}</div>
                            <div className="text-[10px] text-on-surface-variant font-medium mt-0.5">{s.name}</div>
                            <div className="text-[9px] font-bold tracking-widest text-on-tertiary-container mt-2">
                               {s.type === 'THEORY' ? 'THEORY' : 'LAB'}
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                            <div className="bg-tertiary-container text-on-tertiary-container text-xs font-black px-2 py-1 rounded-md">
                               {s.required - s.assigned} left
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {!selectedCell && unassignedSubjects.length === 0 && selectedClass && (
             <div className="flex flex-col items-center justify-center flex-1 text-center border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-lowest/50 text-on-surface-variant mt-6">
               <span className="material-symbols-outlined text-4xl mb-4 text-emerald-500 opacity-80">task_alt</span>
               <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
                 All Caught Up
               </div>
               <div className="text-[10px] font-medium mx-8 opacity-70">
                 Every required subject and lab for this class section has been successfully assigned to the timetable.
               </div>
             </div>
          )}



          {!selectedCell && !selectedClass && (
             <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-lowest/50 text-on-surface-variant">
               <span className="material-symbols-outlined text-4xl mb-4 opacity-50">ads_click</span>
               <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                 Select a class
               </div>
               <div className="text-xs font-medium mt-1 opacity-60 px-6">
                 Choose a Class Section from the top bar to begin dragging and assigning subjects to the scheduling grid.
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
