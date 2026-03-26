import { useEffect, useMemo, useState } from "react";
import { getClasses, getClassSubjects } from "../api/classes";
import { getTeachers, getTeacherSubjects } from "../api/teachers";
import Spinner from "../components/Spinner";
import { getClassLabel } from "../utils/format";

export default function AssignmentOverview({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [classSubjectMap, setClassSubjectMap] = useState({});
  const [teachersBySubject, setTeachersBySubject] = useState({});

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      setLoading(true);
      try {
        const [teachers, classesData] = await Promise.all([
          getTeachers(),
          getClasses(),
        ]);

        const teacherSubjectPairs = await Promise.all(
          teachers.map(async (teacher) => {
            const teacherSubjects = await getTeacherSubjects(teacher.id);
            return { teacher, teacherSubjects };
          }),
        );

        const subjectTeacherMap = {};
        teacherSubjectPairs.forEach(({ teacher, teacherSubjects }) => {
          teacherSubjects.forEach((item) => {
            if (!subjectTeacherMap[item.subjectId]) {
              subjectTeacherMap[item.subjectId] = [];
            }
            subjectTeacherMap[item.subjectId].push({
              id: teacher.id,
              name: teacher.name,
              abbreviation: teacher.abbreviation,
            });
          });
        });

        const classSubjectsPairs = await Promise.all(
          classesData.map(async (classSection) => {
            const classSubjects = await getClassSubjects(classSection.id);
            return [classSection.id, classSubjects];
          }),
        );

        const nextClassSubjectMap = {};
        classSubjectsPairs.forEach(([classId, classSubjects]) => {
          nextClassSubjectMap[classId] = classSubjects;
        });

        if (!active) return;

        setClasses(classesData);
        setClassSubjectMap(nextClassSubjectMap);
        setTeachersBySubject(subjectTeacherMap);
      } catch (err) {
        if (active) {
          showToast(err.message, "error");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      active = false;
    };
  }, [showToast]);

  const classesWithData = useMemo(() => {
    return classes.map((classSection) => ({
      classSection,
      subjects: classSubjectMap[classSection.id] || [],
    }));
  }, [classes, classSubjectMap]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Assignment Overview</h1>
      </div>

      <div className="panel" style={{ marginBottom: 12 }}>
        <h3 className="panel-title">Teacher-Subject Mapping Per Class</h3>
        <div
          className="empty-state"
          style={{ textAlign: "left", padding: "0 0 8px 0" }}
        >
          This page shows each class, its assigned subjects, and the teachers
          currently assigned to those subjects.
        </div>
      </div>

      {classesWithData.map(({ classSection, subjects }) => (
        <div
          key={classSection.id}
          className="panel"
          style={{ marginBottom: 12 }}
        >
          <h3 className="panel-title">{getClassLabel(classSection)}</h3>

          {!subjects.length ? (
            <div className="empty-state">
              No subjects assigned to this class yet.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Teachers Assigned To Subject</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((item) => {
                  const subject = item.subject;
                  const mappedTeachers = teachersBySubject[subject.id] || [];

                  return (
                    <tr key={item.id}>
                      <td>
                        {subject.code} - {subject.name}
                      </td>
                      <td>
                        <span
                          className={`badge ${subject.type === "LAB" ? "badge-lab" : "badge-theory"}`}
                        >
                          {subject.type}
                        </span>
                      </td>
                      <td>
                        {mappedTeachers.length ? (
                          mappedTeachers.map((teacher) => (
                            <span
                              className="chip"
                              key={`${subject.id}-${teacher.id}`}
                            >
                              {teacher.abbreviation}
                            </span>
                          ))
                        ) : (
                          <span className="error-line" style={{ marginTop: 0 }}>
                            No teacher assigned to this subject
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
