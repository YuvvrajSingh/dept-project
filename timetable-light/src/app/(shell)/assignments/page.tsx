"use client";

import { useEffect, useState } from "react";
import { teacherApi, subjectApi, classApi } from "@/lib/api";
import { useAcademicYear } from "@/contexts/academic-year-context";
import type { Teacher, Subject, ClassSection, TeacherSubject, ClassSubject } from "@/lib/types";

type View = "teacher-subject" | "class-subject";

export default function AssignmentsPage() {
  const { selectedYear, isArchived, loading: yearLoading } = useAcademicYear();
  const [view, setView] = useState<View>("teacher-subject");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignSubjectId, setAssignSubjectId] = useState("");
  // Class filter inside the Teacher→Subject modal
  const [modalFilterClassId, setModalFilterClassId] = useState("");
  const [modalClassSubjectIds, setModalClassSubjectIds] = useState<string[] | null>(null);
  const [modalClassLoading, setModalClassLoading] = useState(false);

  useEffect(() => {
    if (yearLoading || !selectedYear) return;
    async function load() {
      try {
        const [t, s, c] = await Promise.all([
          teacherApi.list().catch(() => []),
          subjectApi.list().catch(() => []),
          classApi.list(selectedYear!.id).catch(() => []),
        ]);
        setTeachers(t);
        setSubjects(s);
        setClasses(c);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedYear, yearLoading]);

  async function loadTeacherSubjects(tId: string) {
    setSelectedTeacher(tId);
    const ts = await teacherApi.getSubjects(tId).catch(() => []);
    setTeacherSubjects(ts);
  }

  async function loadClassSubjects(cId: string) {
    setSelectedClass(cId);
    const cs = await classApi.getSubjects(cId).catch(() => []);
    setClassSubjects(cs);
  }

  async function handleModalClassFilter(classIdStr: string) {
    setModalFilterClassId(classIdStr);
    setAssignSubjectId("");
    if (!classIdStr) {
      setModalClassSubjectIds(null);
      return;
    }
    setModalClassLoading(true);
    try {
      const cs = await classApi.getSubjects(classIdStr).catch(() => []);
      setModalClassSubjectIds(cs.map((x: ClassSubject) => x.subjectId));
    } finally {
      setModalClassLoading(false);
    }
  }

  function closeAssignModal() {
    setShowAssign(false);
    setAssignSubjectId("");
    setModalFilterClassId("");
    setModalClassSubjectIds(null);
  }

  async function handleAssign() {
    const subId = assignSubjectId;
    if (!subId) return;
    try {
      if (view === "teacher-subject" && selectedTeacher) {
        await teacherApi.assignSubject(selectedTeacher, subId);
        loadTeacherSubjects(selectedTeacher);
      } else if (view === "class-subject" && selectedClass) {
        await classApi.assignSubject(selectedClass, subId);
        loadClassSubjects(selectedClass);
      }
      closeAssignModal();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error assigning");
    }
  }

  async function handleRemoveTS(teacherId: string, subjectId: string) {
    await teacherApi.removeSubject(teacherId, subjectId).catch(() => {});
    loadTeacherSubjects(teacherId);
  }

  async function handleRemoveCS(classId: string, subjectId: string) {
    await classApi.removeSubject(classId, subjectId).catch(() => {});
    loadClassSubjects(classId);
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter text-on-surface italic">Assignments</h2>
          <p className="text-on-surface-variant text-sm font-medium">
            Map teachers to subjects and subjects to class sections.
          </p>
        </div>
        <div className="flex p-1 bg-surface-container-high rounded-lg">
          <button
            onClick={() => setView("teacher-subject")}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              view === "teacher-subject" ? "bg-surface-container-lowest text-secondary shadow-sm rounded-md" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Teacher → Subject
          </button>
          <button
            onClick={() => setView("class-subject")}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              view === "class-subject" ? "bg-surface-container-lowest text-secondary shadow-sm rounded-md" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Class → Subject
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entity list */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4">
            {view === "teacher-subject" ? "Select Teacher" : "Select Class"}
          </h3>
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-on-surface-variant">Loading...</p>
            ) : view === "teacher-subject" ? (
              teachers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadTeacherSubjects(t.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    selectedTeacher === t.id ? "bg-secondary text-white" : "hover:bg-surface-container-lowest"
                  }`}
                >
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                    selectedTeacher === t.id ? "bg-white/20 text-white" : "bg-primary-fixed text-on-primary-fixed"
                  }`}>
                    {t.abbreviation.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className={`text-[10px] ${selectedTeacher === t.id ? "text-white/60" : "text-on-surface-variant"}`}>{t.abbreviation}</p>
                  </div>
                </button>
              ))
            ) : (
              classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadClassSubjects(c.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    selectedClass === c.id ? "bg-secondary text-white" : "hover:bg-surface-container-lowest"
                  }`}
                >
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                    selectedClass === c.id ? "bg-white/20 text-white" : "bg-primary-fixed text-on-primary-fixed"
                  }`}>
                    {c.branch?.name?.slice(0, 2) || "??"}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{c.branch?.name} Sem {c.semester}</p>
                    <p className={`text-[10px] ${selectedClass === c.id ? "text-white/60" : "text-on-surface-variant"}`}>Year {c.year} &nbsp;·&nbsp; Section ID: {c.id}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Assigned subjects */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Assigned Subjects</h3>
            {(selectedTeacher || selectedClass) && (
              <button
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-secondary to-secondary-container text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Assign Subject
              </button>
            )}
          </div>

          {!selectedTeacher && !selectedClass ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-outline-variant/20 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-outline-variant/40 mb-4">assignment_ind</span>
              <p className="text-sm font-bold text-on-surface-variant">Select an entity from the left</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(view === "teacher-subject" ? teacherSubjects : classSubjects).map((assignment) => {
                const sub = subjects.find((s) => s.id === assignment.subjectId);
                return (
                  <div
                    key={assignment.id}
                    className={`p-5 rounded-xl border-l-4 shadow-sm ${
                      sub?.type === "LAB" ? "border-on-tertiary-container bg-tertiary-fixed/10" : "border-secondary bg-secondary-fixed/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
                        sub?.type === "LAB" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-secondary/10 text-secondary"
                      }`}>
                        {sub?.code || "—"}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        sub?.type === "LAB" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-primary-fixed text-on-primary-fixed-variant"
                      }`}>
                        {sub?.type || "—"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-on-surface mb-1">{sub?.name || "Unknown Subject"}</h4>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/10">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{sub?.creditHours || 0} Credits</span>
                      <button
                        onClick={() => {
                          if (view === "teacher-subject" && selectedTeacher) handleRemoveTS(selectedTeacher, assignment.subjectId);
                          else if (view === "class-subject" && selectedClass) handleRemoveCS(selectedClass, assignment.subjectId);
                        }}
                        className="text-on-surface-variant hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">link_off</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" onClick={closeAssignModal} />
          <div className="relative bg-surface-container-lowest p-8 rounded-xl shadow-2xl w-full max-w-sm">
            <h3 className="text-lg font-black tracking-tighter mb-1">Assign Subject</h3>

            {view === "teacher-subject" && (
              <>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-5">
                  Optionally filter by class
                </p>
                {/* Class filter */}
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Filter by Class</label>
                <select
                  value={modalFilterClassId}
                  onChange={(e) => handleModalClassFilter(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg text-sm font-semibold p-3 mb-4 outline-none"
                >
                  <option value="">All subjects</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.branch?.name} Sem {c.semester} (Year {c.year})
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Subject picker */}
            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Subject</label>
            <select
              value={assignSubjectId}
              onChange={(e) => setAssignSubjectId(e.target.value)}
              disabled={modalClassLoading}
              className="w-full bg-surface-container-low border-none rounded-lg text-sm font-semibold p-3 mb-6 outline-none disabled:opacity-50"
            >
              <option value="">
                {modalClassLoading ? "Loading..." : "Select a subject..."}
              </option>
              {(modalClassSubjectIds !== null
                ? subjects.filter((s) => modalClassSubjectIds.includes(s.id))
                : subjects
              ).map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button onClick={closeAssignModal} className="flex-1 py-3 border border-outline-variant/30 text-on-surface-variant font-bold text-xs uppercase tracking-widest rounded-lg">Cancel</button>
              <button onClick={handleAssign} className="flex-1 py-3 bg-secondary text-white font-bold text-xs uppercase tracking-widest rounded-lg">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
