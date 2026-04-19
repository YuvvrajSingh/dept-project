"use client";

import { useEffect, useState, useRef, useMemo, createRef } from "react";
import { teacherMeApi } from "@/lib/api";
import TinderCard from "react-tinder-card";

type AssignedClass = {
  classSectionId: string;
  subjectId: string;
  label: string;
  subjectName: string;
};

export default function TeacherAttendancePage() {
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [selectedClassStr, setSelectedClassStr] = useState<string>("");

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, "Present" | "Absent">>({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Tinder Card State
  const [currentIndex, setCurrentIndex] = useState(0);
  // Store refs to cards so we can manually swipe via buttons
  const childRefs = useMemo(() => Array(100).fill(0).map(i => createRef<any>()), []); // Fixed size buffer

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const p = await teacherMeApi.get();
        if (!active) return;
        setProfile(p);

        const res = await fetch(`/api/teachers/${p.id}/schedule`);
        const schedule = await res.json();
        
        const uniqueClasses = new Map<string, AssignedClass>();
        
        for (const item of schedule.matrix || []) {
          for (const entry of item.classes || []) {
             if (!entry.classSectionId || !entry.subjectId) continue;
             const key = `${entry.classSectionId}_${entry.subjectId}`;
             if (!uniqueClasses.has(key)) {
                uniqueClasses.set(key, {
                  classSectionId: entry.classSectionId,
                  subjectId: entry.subjectId,
                  label: `${entry.classSection?.branch?.name || "Branch"} Sem ${entry.classSection?.semester || "?"}`,
                  subjectName: entry.subject?.name || "Unknown Subject"
                });
             }
          }
        }
        
        const arr = Array.from(uniqueClasses.values());
        setClasses(arr);
        if (arr.length > 0) setSelectedClassStr(`${arr[0].classSectionId}_${arr[0].subjectId}`);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    init();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedClassStr) {
      setStudents([]);
      setCurrentIndex(-1);
      return;
    }
    const [cId] = selectedClassStr.split("_");
    fetch(`/api/students?classSectionId=${cId}`)
      .then(res => res.json())
      .then(data => {
        // Reverse array so that the first student is at the top of the stack (index students.length - 1)
        const reversed = [...data].reverse();
        setStudents(reversed);
        setCurrentIndex(reversed.length - 1);
        setAttendanceState({});
        setMessage(null);
      })
      .catch(console.error);
  }, [selectedClassStr]);

  const updateIndex = (val: number) => {
    setCurrentIndex(val);
  };

  const swiped = (direction: string, studentId: string, index: number) => {
    const status = direction === "right" ? "Present" : "Absent";
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
    updateIndex(index - 1);
  };

  const outOfFrame = (name: string, idx: number) => {
    // Optional cleanup
  };

  const swipe = async (dir: "left" | "right") => {
    if (currentIndex >= 0 && currentIndex < students.length) {
      // @ts-ignore
      await childRefs[currentIndex].current?.swipe(dir); // Swipe the card!
    }
  };

  async function submitAttendance() {
    if (!selectedClassStr || !date) return;
    setSubmitting(true);
    setMessage(null);
    const [cId, sId] = selectedClassStr.split("_");
    
    // Fallback: if they somehow skipped swiping or we want to force everything
    // Actually, in Tinder mode, we only submit when swiping is done!
    const payload = students.map(s => ({
      studentId: s.id,
      subjectId: sId,
      date,
      status: attendanceState[s.id] || "Absent" // By default if missed, marked absent
    }));

    try {
      const res = await fetch("/api/attendance/mark-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to submit");
      setMessage({ type: "success", text: "Attendance synced to ledger successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to sync attendance." });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  function resetSwipe() {
    setAttendanceState({});
    setCurrentIndex(students.length - 1);
  }

  if (loading) return <div className="p-10 animate-pulse bg-surface-variant/20 rounded-[2rem] h-64"></div>;

  return (
    <div className="space-y-8 pb-32">
      <header>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Attendance Ledger</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mt-2 border-b border-outline-variant/20 pb-4 inline-block">
          Swipe Evaluation Mode
        </p>
      </header>

      {classes.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-outline-variant/40 rounded-[2rem]">
          <h3 className="text-xl font-black uppercase text-on-surface">No Classes Assigned</h3>
          <p className="text-sm text-on-surface-variant font-medium mt-2">You do not have any timetable entries assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Controls */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col md:flex-row gap-6 shadow-sm">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block">Subject & Class</label>
              <select
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all"
                value={selectedClassStr}
                onChange={e => setSelectedClassStr(e.target.value)}
              >
                {classes.map(c => (
                  <option key={`${c.classSectionId}_${c.subjectId}`} value={`${c.classSectionId}_${c.subjectId}`}>
                    {c.label} — {c.subjectName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block">Session Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
             <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
               {currentIndex < 0 ? "Evaluation Complete" : `Remaining: ${currentIndex + 1} / ${students.length}`}
             </div>
             {currentIndex < 0 && students.length > 0 && (
                <button onClick={resetSwipe} className="text-[10px] font-black tracking-widest uppercase text-primary hover:underline">
                  Restart Session
                </button>
             )}
          </div>

          {/* Swipe UI */}
          {students.length > 0 ? (
            <div className="relative h-[480px] w-full max-w-sm mx-auto flex items-center justify-center">
              {currentIndex < 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-[2rem] p-8 text-center animate-in fade-in zoom-in duration-500">
                    <span className="material-symbols-outlined text-[4rem] text-primary mb-4 block">task_alt</span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-on-surface">Cohort Evaluated</h3>
                    <p className="text-sm font-medium text-on-surface-variant mt-2 mb-6">All students have been marked.</p>
                    <button
                      onClick={submitAttendance}
                      disabled={submitting}
                      className="bg-primary text-on-primary px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-95 transition-transform disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? <span className="material-symbols-outlined animate-spin-slow text-base">sync</span> : <span className="material-symbols-outlined text-base">cloud_upload</span>}
                      {submitting ? "Syncing..." : "Sync Ledger"}
                    </button>
                    {message && (
                      <p className={`mt-4 text-[10px] font-bold tracking-widest uppercase ${message.type === 'success' ? 'text-primary' : 'text-error'}`}>
                        {message.text}
                      </p>
                    )}
                 </div>
              )}

              {students.map((st, index) => (
                <TinderCard
                  // @ts-ignore
                  ref={childRefs[index]}
                  className="absolute"
                  key={st.id}
                  onSwipe={(dir) => swiped(dir, st.id, index)}
                  onCardLeftScreen={() => outOfFrame(st.name, index)}
                  preventSwipe={["up", "down"]}
                >
                  <div className={`w-[320px] h-[400px] bg-surface-container-highest rounded-[2.5rem] shadow-2xl p-8 border border-outline-variant/20 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                    index === currentIndex ? "scale-100 opacity-100 z-10" : 
                    index > currentIndex ? "scale-[0.8] opacity-0 pointer-events-none -z-10" :
                    "scale-95 -mt-4 opacity-50 z-0 pointer-events-none" // Cards beneath
                  }`}>
                     {/* Background icon based on branch, etc. */}
                     <span className="material-symbols-outlined absolute -top-10 -right-10 text-[180px] text-on-surface/5 pointer-events-none select-none">
                       account_circle
                     </span>
                     
                     <div className="w-24 h-24 bg-primary-container text-on-primary-container rounded-[2rem] flex items-center justify-center text-4xl font-black uppercase mb-6 shadow-inner">
                        {st.name?.charAt(0) || "?"}
                     </div>
                     <h2 className="text-2xl font-black uppercase tracking-tight text-center text-on-surface leading-tight">
                       {st.name}
                     </h2>
                     <p className="text-sm font-bold uppercase tracking-widest text-primary mt-2 flex items-center gap-2">
                       <span className="material-symbols-outlined text-base">badge</span>
                       {st.rollNumber}
                     </p>
                     
                     <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-12 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
                        <span className="flex flex-col items-center gap-1"><span className="material-symbols-outlined text-2xl text-error opacity-50">arrow_back</span>Absent</span>
                        <span className="flex flex-col items-center gap-1"><span className="material-symbols-outlined text-2xl text-primary opacity-50">arrow_forward</span>Present</span>
                     </div>
                  </div>
                </TinderCard>
              ))}
            </div>
          ) : (
             <div className="p-12 text-center text-on-surface-variant text-sm font-bold uppercase tracking-widest">
               Loading cohort data...
             </div>
          )}
          
          {/* Manual Buttons */}
          {students.length > 0 && currentIndex >= 0 && (
             <div className="flex justify-center gap-6 mt-8">
               <button 
                 onClick={() => swipe("left")} 
                 className="w-16 h-16 rounded-[2rem] bg-error-container text-on-error-container flex items-center justify-center text-3xl shadow-lg hover:scale-90 transition-transform cursor-pointer"
               >
                 <span className="material-symbols-outlined font-black">close</span>
               </button>
               <button 
                 onClick={() => swipe("right")} 
                 className="w-16 h-16 rounded-[2rem] bg-primary-container text-on-primary-container flex items-center justify-center text-3xl shadow-lg hover:scale-90 transition-transform cursor-pointer"
               >
                 <span className="material-symbols-outlined font-black">check</span>
               </button>
             </div>
          )}

        </div>
      )}
    </div>
  );
}
