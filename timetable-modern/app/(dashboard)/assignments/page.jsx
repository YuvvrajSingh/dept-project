"use client";

import { useEffect, useMemo, useState } from "react";
import {
  assignTeacherSubject, getTeacherSubjects, getTeachers, removeTeacherSubject,
} from "@/lib/api/teachers";
import {
  assignClassSubject, getClassSubjects, getClasses, removeClassSubject,
} from "@/lib/api/classes";
import { getSubjects } from "@/lib/api/subjects";
import { useToast } from "@/lib/toast-context";
import { getClassLabel } from "@/lib/utils/format";
import PageShell from "@/components/page-shell";
import ConflictBanner from "@/components/conflict-banner";
import Spinner from "@/components/spinner";
import { X } from "lucide-react";

const inputBase = "w-full border-2 border-foreground bg-background font-mono text-sm h-10 px-3 focus:ring-2 focus:ring-accent focus:border-accent outline-none";
const labelClass = "text-[10px] font-mono tracking-[0.2em] uppercase font-bold block mb-2";

export default function AssignmentsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [teacherSubjectToAssign, setTeacherSubjectToAssign] = useState("");
  const [classSubjectToAssign, setClassSubjectToAssign] = useState("");
  const [teacherConflict, setTeacherConflict] = useState("");
  const [classConflict, setClassConflict] = useState("");

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [t, c, s] = await Promise.all([getTeachers(), getClasses(), getSubjects()]);
        setTeachers(t); setClasses(c); setSubjects(s);
      } catch (err) { showToast(err.message, "error"); }
      finally { setLoading(false); }
    }
    init();
  }, [showToast]);

  useEffect(() => {
    if (!teacherId) { setTeacherSubjects([]); return; }
    async function load() {
      try { setTeacherSubjects(await getTeacherSubjects(teacherId)); }
      catch (err) { showToast(err.message, "error"); }
    }
    setTeacherConflict("");
    load();
  }, [teacherId, showToast]);

  useEffect(() => {
    if (!classId) { setClassSubjects([]); return; }
    async function load() {
      try { setClassSubjects(await getClassSubjects(classId)); }
      catch (err) { showToast(err.message, "error"); }
    }
    setClassConflict("");
    load();
  }, [classId, showToast]);

  const unassignedTeacherSubjects = useMemo(() => {
    const assigned = new Set(teacherSubjects.map((i) => i.subjectId));
    return subjects.filter((s) => !assigned.has(s.id));
  }, [teacherSubjects, subjects]);

  const unassignedClassSubjects = useMemo(() => {
    const assigned = new Set(classSubjects.map((i) => i.subjectId));
    return subjects.filter((s) => !assigned.has(s.id));
  }, [classSubjects, subjects]);

  const refreshTeacher = async () => setTeacherSubjects(await getTeacherSubjects(teacherId));
  const refreshClass = async () => setClassSubjects(await getClassSubjects(classId));

  const handleAssignTeacher = async () => {
    if (!teacherId || !teacherSubjectToAssign) return;
    try {
      await assignTeacherSubject(teacherId, Number(teacherSubjectToAssign));
      showToast("SUBJECT ASSIGNED TO TEACHER", "success");
      setTeacherConflict(""); setTeacherSubjectToAssign(""); await refreshTeacher();
    } catch (err) {
      err.status === 409 ? setTeacherConflict(err.message) : showToast(err.message, "error");
    }
  };

  const handleRemoveTeacher = async (subjectId) => {
    try {
      await removeTeacherSubject(teacherId, subjectId);
      showToast("TEACHER SUBJECT REMOVED", "success");
      setTeacherConflict(""); await refreshTeacher();
    } catch (err) {
      err.status === 409 ? setTeacherConflict(err.message) : showToast(err.message, "error");
    }
  };

  const handleAssignClass = async () => {
    if (!classId || !classSubjectToAssign) return;
    try {
      await assignClassSubject(classId, Number(classSubjectToAssign));
      showToast("SUBJECT ASSIGNED TO CLASS", "success");
      setClassConflict(""); setClassSubjectToAssign(""); await refreshClass();
    } catch (err) {
      err.status === 409 ? setClassConflict(err.message) : showToast(err.message, "error");
    }
  };

  const handleRemoveClass = async (subjectId) => {
    try {
      await removeClassSubject(classId, subjectId);
      showToast("CLASS SUBJECT REMOVED", "success");
      setClassConflict(""); await refreshClass();
    } catch (err) {
      err.status === 409 ? setClassConflict(err.message) : showToast(err.message, "error");
    }
  };

  if (loading) return <Spinner />;

  return (
    <PageShell title="ASSIGNMENTS" subtitle="SYS.AUTH // MODULE_03 — SUBJECT MAPPING">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Teacher Subjects */}
        <div className="border-2 border-foreground bg-card p-6 space-y-4">
          <h3 className="font-heading text-sm font-bold tracking-wider uppercase">TEACHER SUBJECTS</h3>
          <div className="h-[2px] w-12 bg-accent" />
          <ConflictBanner message={teacherConflict} type="conflict" />

          <div>
            <label className={labelClass}>TEACHER</label>
            <select className={inputBase} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">SELECT TEACHER</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.abbreviation} - {t.name}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {teacherSubjects.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-1 border-2 border-foreground px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold uppercase">
                {item.subject.code}
                <button type="button" onClick={() => handleRemoveTeacher(item.subjectId)} className="hover:text-destructive ml-1">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <select className={inputBase} value={teacherSubjectToAssign} onChange={(e) => setTeacherSubjectToAssign(e.target.value)}>
              <option value="">ASSIGN SUBJECT</option>
              {unassignedTeacherSubjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
            </select>
            <button type="button" onClick={handleAssignTeacher}
              className="border-2 border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-mono text-xs tracking-wider px-4 h-10 uppercase font-bold transition-colors shrink-0">
              ASSIGN
            </button>
          </div>
        </div>

        {/* Class Subjects */}
        <div className="border-2 border-foreground bg-card p-6 space-y-4">
          <h3 className="font-heading text-sm font-bold tracking-wider uppercase">CLASS SUBJECTS</h3>
          <div className="h-[2px] w-12 bg-accent" />
          <ConflictBanner message={classConflict} type="conflict" />

          <div>
            <label className={labelClass}>CLASS</label>
            <select className={inputBase} value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">SELECT CLASS</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{getClassLabel(c)}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {classSubjects.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-1 border-2 border-foreground px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold uppercase">
                {item.subject.code}
                <button type="button" onClick={() => handleRemoveClass(item.subjectId)} className="hover:text-destructive ml-1">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <select className={inputBase} value={classSubjectToAssign} onChange={(e) => setClassSubjectToAssign(e.target.value)}>
              <option value="">ASSIGN SUBJECT</option>
              {unassignedClassSubjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
            </select>
            <button type="button" onClick={handleAssignClass}
              className="border-2 border-foreground bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-mono text-xs tracking-wider px-4 h-10 uppercase font-bold transition-colors shrink-0">
              ASSIGN
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
