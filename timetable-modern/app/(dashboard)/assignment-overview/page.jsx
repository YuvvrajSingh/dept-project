"use client";

import { useEffect, useMemo, useState } from "react";
import { getClasses, getClassSubjects } from "@/lib/api/classes";
import { getTeachers, getTeacherSubjects } from "@/lib/api/teachers";
import { useToast } from "@/lib/toast-context";
import { getClassLabel } from "@/lib/utils/format";
import PageShell from "@/components/page-shell";
import Spinner from "@/components/spinner";
import { motion } from "framer-motion";

export default function AssignmentOverviewPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [classSubjectMap, setClassSubjectMap] = useState({});
  const [teachersBySubject, setTeachersBySubject] = useState({});

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      setLoading(true);
      try {
        const [teachers, classesData] = await Promise.all([getTeachers(), getClasses()]);
        const teacherSubjectPairs = await Promise.all(
          teachers.map(async (teacher) => {
            const ts = await getTeacherSubjects(teacher.id);
            return { teacher, teacherSubjects: ts };
          })
        );
        const subjectTeacherMap = {};
        teacherSubjectPairs.forEach(({ teacher, teacherSubjects }) => {
          teacherSubjects.forEach((item) => {
            if (!subjectTeacherMap[item.subjectId]) subjectTeacherMap[item.subjectId] = [];
            subjectTeacherMap[item.subjectId].push({ id: teacher.id, name: teacher.name, abbreviation: teacher.abbreviation });
          });
        });
        const classSubjectsPairs = await Promise.all(
          classesData.map(async (cs) => {
            const csubs = await getClassSubjects(cs.id);
            return [cs.id, csubs];
          })
        );
        const nextMap = {};
        classSubjectsPairs.forEach(([cid, csubs]) => { nextMap[cid] = csubs; });
        if (!active) return;
        setClasses(classesData);
        setClassSubjectMap(nextMap);
        setTeachersBySubject(subjectTeacherMap);
      } catch (err) {
        if (active) showToast(err.message, "error");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOverview();
    return () => { active = false; };
  }, [showToast]);

  const classesWithData = useMemo(
    () => classes.map((cs) => ({ classSection: cs, subjects: classSubjectMap[cs.id] || [] })),
    [classes, classSubjectMap]
  );

  if (loading) return <Spinner />;

  return (
    <PageShell title="ASSIGNMENT OVERVIEW" subtitle="SYS.AUTH // MODULE_04 — TEACHER-SUBJECT MAPPING PER CLASS">
      <div className="border-2 border-foreground bg-card p-4 mb-4">
        <p className="text-[11px] font-mono text-muted-foreground tracking-wider uppercase">
          ◼ THIS PAGE SHOWS EACH CLASS, ITS ASSIGNED SUBJECTS, AND THE TEACHERS CURRENTLY ASSIGNED TO THOSE SUBJECTS ◼
        </p>
      </div>

      <div className="space-y-4">
        {classesWithData.map(({ classSection, subjects }, index) => (
          <motion.div
            key={classSection.id}
            className="border-2 border-foreground bg-card p-4 space-y-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase">{getClassLabel(classSection)}</h3>
            <div className="h-[2px] w-10 bg-accent" />

            {!subjects.length ? (
              <div className="border-2 border-foreground border-dashed p-6 text-center">
                <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
                  ◼ NO SUBJECTS ASSIGNED ◼
                </span>
              </div>
            ) : (
              <div className="border-2 border-foreground overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-foreground bg-muted">
                      <th className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-foreground h-10 px-4 text-left">SUBJECT</th>
                      <th className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-foreground h-10 px-4 text-left">TYPE</th>
                      <th className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-foreground h-10 px-4 text-left">TEACHERS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((item) => {
                      const subject = item.subject;
                      const mappedTeachers = teachersBySubject[subject.id] || [];
                      return (
                        <tr key={item.id} className="border-b border-foreground/10 hover:bg-accent/20 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono">{subject.code} - {subject.name}</td>
                          <td className="px-4 py-3 text-xs font-mono">
                            <span className={`status-tag ${subject.type === "LAB" ? "text-chart-2" : "text-chart-3"}`}>
                              {subject.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono">
                            {mappedTeachers.length ? (
                              <div className="flex flex-wrap gap-1">
                                {mappedTeachers.map((t) => (
                                  <span key={`${subject.id}-${t.id}`} className="border-2 border-foreground px-2 py-0 text-[9px] font-mono tracking-[0.15em] font-bold uppercase">
                                    {t.abbreviation}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-destructive text-[10px] font-mono font-bold uppercase tracking-wider">
                                ◼ NO TEACHER ASSIGNED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}
