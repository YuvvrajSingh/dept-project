import { useEffect, useMemo, useState } from "react";
import {
  assignTeacherSubject,
  getTeacherSubjects,
  getTeachers,
  removeTeacherSubject,
} from "../api/teachers";
import {
  assignClassSubject,
  getClassSubjects,
  getClasses,
  removeClassSubject,
} from "../api/classes";
import { getSubjects } from "../api/subjects";
import ConflictBanner from "../components/ConflictBanner";
import Spinner from "../components/Spinner";
import { getClassLabel } from "../utils/format";

export default function Assignments({ showToast }) {
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
        const [teachersData, classesData, subjectsData] = await Promise.all([
          getTeachers(),
          getClasses(),
          getSubjects(),
        ]);
        setTeachers(teachersData);
        setClasses(classesData);
        setSubjects(subjectsData);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [showToast]);

  useEffect(() => {
    if (!teacherId) {
      setTeacherSubjects([]);
      return;
    }

    async function loadTeacherSubjects() {
      try {
        const data = await getTeacherSubjects(teacherId);
        setTeacherSubjects(data);
      } catch (err) {
        showToast(err.message, "error");
      }
    }

    setTeacherConflict("");
    loadTeacherSubjects();
  }, [teacherId, showToast]);

  useEffect(() => {
    if (!classId) {
      setClassSubjects([]);
      return;
    }

    async function loadClassSubjects() {
      try {
        const data = await getClassSubjects(classId);
        setClassSubjects(data);
      } catch (err) {
        showToast(err.message, "error");
      }
    }

    setClassConflict("");
    loadClassSubjects();
  }, [classId, showToast]);

  const unassignedTeacherSubjects = useMemo(() => {
    const assigned = new Set(teacherSubjects.map((item) => item.subjectId));
    return subjects.filter((subject) => !assigned.has(subject.id));
  }, [teacherSubjects, subjects]);

  const unassignedClassSubjects = useMemo(() => {
    const assigned = new Set(classSubjects.map((item) => item.subjectId));
    return subjects.filter((subject) => !assigned.has(subject.id));
  }, [classSubjects, subjects]);

  const refreshTeacherSubjects = async () => {
    const data = await getTeacherSubjects(teacherId);
    setTeacherSubjects(data);
  };

  const refreshClassSubjects = async () => {
    const data = await getClassSubjects(classId);
    setClassSubjects(data);
  };

  const handleAssignTeacher = async () => {
    if (!teacherId || !teacherSubjectToAssign) return;

    try {
      await assignTeacherSubject(teacherId, Number(teacherSubjectToAssign));
      showToast("Subject assigned to teacher", "success");
      setTeacherConflict("");
      setTeacherSubjectToAssign("");
      await refreshTeacherSubjects();
    } catch (err) {
      if (err.status === 409) {
        setTeacherConflict(err.message);
      } else {
        showToast(err.message, "error");
      }
    }
  };

  const handleRemoveTeacher = async (subjectId) => {
    try {
      await removeTeacherSubject(teacherId, subjectId);
      showToast("Teacher subject removed", "success");
      setTeacherConflict("");
      await refreshTeacherSubjects();
    } catch (err) {
      if (err.status === 409) {
        setTeacherConflict(err.message);
      } else {
        showToast(err.message, "error");
      }
    }
  };

  const handleAssignClass = async () => {
    if (!classId || !classSubjectToAssign) return;

    try {
      await assignClassSubject(classId, Number(classSubjectToAssign));
      showToast("Subject assigned to class", "success");
      setClassConflict("");
      setClassSubjectToAssign("");
      await refreshClassSubjects();
    } catch (err) {
      if (err.status === 409) {
        setClassConflict(err.message);
      } else {
        showToast(err.message, "error");
      }
    }
  };

  const handleRemoveClass = async (subjectId) => {
    try {
      await removeClassSubject(classId, subjectId);
      showToast("Class subject removed", "success");
      setClassConflict("");
      await refreshClassSubjects();
    } catch (err) {
      if (err.status === 409) {
        setClassConflict(err.message);
      } else {
        showToast(err.message, "error");
      }
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Assignments</h1>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3 className="panel-title">Teacher Subjects</h3>
          <ConflictBanner message={teacherConflict} type="conflict" />

          <div className="form-group">
            <label>Teacher</label>
            <select
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.abbreviation} - {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            {teacherSubjects.map((item) => (
              <span className="chip" key={item.id}>
                {item.subject.code}
                <button
                  className="chip-remove"
                  type="button"
                  onClick={() => handleRemoveTeacher(item.subjectId)}
                >
                  x
                </button>
              </span>
            ))}
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <select
              value={teacherSubjectToAssign}
              onChange={(event) =>
                setTeacherSubjectToAssign(event.target.value)
              }
            >
              <option value="">Assign subject</option>
              {unassignedTeacherSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleAssignTeacher}
            >
              Assign
            </button>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Class Subjects</h3>
          <ConflictBanner message={classConflict} type="conflict" />

          <div className="form-group">
            <label>Class</label>
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {getClassLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div>
            {classSubjects.map((item) => (
              <span className="chip" key={item.id}>
                {item.subject.code}
                <button
                  className="chip-remove"
                  type="button"
                  onClick={() => handleRemoveClass(item.subjectId)}
                >
                  x
                </button>
              </span>
            ))}
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <select
              value={classSubjectToAssign}
              onChange={(event) => setClassSubjectToAssign(event.target.value)}
            >
              <option value="">Assign subject</option>
              {unassignedClassSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleAssignClass}
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
